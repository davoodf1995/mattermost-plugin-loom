import {createInstance, setup} from '@loomhq/record-sdk';
import {isSupported} from '@loomhq/record-sdk/is-supported';
import {Client4} from 'mattermost-redux/client';

import {parseJSONResponse, pluginFetch, withTimeout} from '../utils';

const BUTTON_ID = 'loom-record-sdk-button';
const SDK_INIT_TIMEOUT_MS = 30000;

async function createLoomInstance(config) {
    const sdkConfig = {
        publicAppId: config.LoomPublicAppId,
        environment: config.LoomEnvironment || 'production',
        config: {insertButtonText: 'Share in Mattermost'},
    };

    if (typeof createInstance === 'function') {
        return createInstance({
            mode: 'standard',
            ...sdkConfig,
        });
    }

    if (typeof setup === 'function') {
        return setup(sdkConfig);
    }

    throw new Error('loom-sdk-missing');
}

export default class LoomClient {
    constructor() {
        this.config = null;
        this.sdkButton = null;
        this.setupPromise = null;
        this.channelId = '';
        this.rootId = '';
    }

    loadConfig() {
        if (this.config) {
            return Promise.resolve(this.config);
        }

        return pluginFetch('/config', {
            headers: {Accept: 'application/json'},
        }).then((response) => {
            if (!response.ok) {
                throw new Error('loom-plugin-unavailable');
            }
            return parseJSONResponse(response);
        }).then((config) => {
            this.config = config;
            return config;
        });
    }

    resetSDK() {
        this.sdkButton = null;
        this.setupPromise = null;
    }

    async ensureSDK() {
        if (this.sdkButton) {
            return this.sdkButton;
        }

        if (this.setupPromise) {
            return this.setupPromise;
        }

        this.setupPromise = withTimeout(
            this.initializeSDK(),
            SDK_INIT_TIMEOUT_MS,
            'Loom recorder timed out. Check that third-party cookies are enabled and your Mattermost domain is allowed in dev.loom.com.',
        ).catch((error) => {
            this.setupPromise = null;
            throw error;
        });

        return this.setupPromise;
    }

    async initializeSDK() {
        const config = await this.loadConfig();
        if (!config?.LoomPublicAppId) {
            throw new Error('loom-not-configured');
        }
        if (config.EnableRecordButton === false) {
            throw new Error('loom-record-disabled');
        }

        await this.waitForButton();

        const support = await isSupported();
        if (!support.supported) {
            throw new Error(support.error || 'loom-not-supported');
        }

        const instance = await createLoomInstance(config);
        const configureButton = instance.configureButton;
        if (typeof configureButton !== 'function') {
            throw new Error('loom-sdk-unavailable');
        }

        const button = document.getElementById(BUTTON_ID);
        if (!button) {
            throw new Error('loom-sdk-unavailable');
        }

        const sdkButton = configureButton({element: button});
        sdkButton.on('insert-click', (video) => {
            this.handleVideoInsert(video);
        });

        this.sdkButton = sdkButton;
        return sdkButton;
    }

    waitForButton(attempts = 50) {
        return new Promise((resolve, reject) => {
            const tryFind = (remaining) => {
                if (document.getElementById(BUTTON_ID)) {
                    resolve();
                    return;
                }
                if (remaining <= 0) {
                    reject(new Error('loom-sdk-unavailable'));
                    return;
                }
                window.setTimeout(() => tryFind(remaining - 1), 100);
            };
            tryFind(attempts);
        });
    }

    handleVideoInsert(video) {
        if (!video?.sharedUrl) {
            return;
        }
        this.postVideo(video, this.channelId, this.rootId).catch((error) => {
            // eslint-disable-next-line no-alert
            window.alert(error.message || 'Failed to post Loom video.');
        });
    }

    async postVideo(video, channelId, rootId = '') {
        if (!channelId) {
            throw new Error('Open a channel before sharing a Loom video.');
        }

        const post = {
            channel_id: channelId,
            root_id: rootId,
            message: video.sharedUrl,
            type: 'custom_loom',
            props: {
                loom_video: true,
                sharedUrl: video.sharedUrl,
                embedUrl: video.embedUrl,
                title: video.title,
                thumbnailUrl: video.thumbnailUrl,
                width: video.width,
                height: video.height,
                duration: video.duration,
            },
        };

        await Client4.createPost(post);
    }

    async startRecording(channelId = '', rootId = '') {
        this.channelId = channelId;
        this.rootId = rootId;

        const config = await this.loadConfig();
        if (!config?.LoomPublicAppId) {
            throw new Error('loom-not-configured');
        }
        if (config.EnableRecordButton === false) {
            throw new Error('loom-record-disabled');
        }

        const sdkButton = await this.ensureSDK();
        const button = document.getElementById(BUTTON_ID);

        if (typeof sdkButton.openPreRecordPanel === 'function') {
            sdkButton.openPreRecordPanel();
        } else if (button) {
            button.click();
        } else {
            throw new Error('loom-sdk-unavailable');
        }
    }
}

export {BUTTON_ID};
