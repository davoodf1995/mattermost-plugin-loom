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
        this.overlayListener = null;
    }

    setOverlayListener(listener) {
        this.overlayListener = listener;
    }

    showOverlay(overlay) {
        if (this.overlayListener) {
            this.overlayListener(overlay);
        }
    }

    clearOverlay() {
        if (this.overlayListener) {
            this.overlayListener(null);
        }
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
            'Loom recorder timed out. Your admin may need to allow www.loom.com in Mattermost CSP and register this site at dev.loom.com.',
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
            this.clearOverlay();
            this.handleVideoInsert(video);
        });
        sdkButton.on('cancel', () => {
            this.clearOverlay();
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
            this.showOverlay({
                title: 'Could not post Loom video',
                message: 'The recording finished but Mattermost could not create the post.',
                error: error.message || 'Unknown error',
                showFallback: false,
            });
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

        this.showOverlay({
            title: 'Starting Loom recorder',
            message: 'Connecting to Loom. A recording panel should appear on screen in a few seconds.',
            showFallback: true,
        });

        try {
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

            this.showOverlay({
                title: 'Loom recorder ready',
                message: 'Use the Loom panel to record. When finished, click Share in Mattermost to post the video to this channel.',
                showFallback: true,
            });
        } catch (error) {
            this.resetSDK();
            this.showOverlay({
                title: 'Loom recorder failed',
                message: 'In-app recording could not start. Install the Loom Chrome extension or desktop app, record there, then paste the share link in Mattermost.',
                error: error.message || 'Unknown error',
                showFallback: true,
            });
            throw error;
        }
    }
}

export {BUTTON_ID};
