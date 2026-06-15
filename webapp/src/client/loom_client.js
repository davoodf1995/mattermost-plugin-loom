import {Client4} from 'mattermost-redux/client';

import {getPluginURL, parseJSONResponse} from '../utils';

const BUTTON_ID = 'loom-record-sdk-button';

const DEFAULT_EMBED_WIDTH = 480;

export default class LoomClient {
    constructor() {
        this.config = null;
        this.sdkButton = null;
        this.setupPromise = null;
        this.onVideoInsert = null;
        this.channelId = '';
        this.rootId = '';
    }

    loadConfig() {
        if (this.config) {
            return Promise.resolve(this.config);
        }

        return fetch(`${getPluginURL()}/config`, {
            headers: {Accept: 'application/json'},
            credentials: 'same-origin',
        }).then(parseJSONResponse).then((config) => {
            this.config = config;
            return config;
        });
    }

    setInsertHandler(handler) {
        this.onVideoInsert = handler;
    }

    async ensureSDK() {
        if (this.sdkButton) {
            return this.sdkButton;
        }

        if (this.setupPromise) {
            return this.setupPromise;
        }

        this.setupPromise = this.initializeSDK();
        return this.setupPromise;
    }

    async initializeSDK() {
        const config = await this.loadConfig();
        if (!config?.LoomPublicAppId || !config.EnableRecordButton) {
            return null;
        }

        const button = document.getElementById(BUTTON_ID);
        if (!button) {
            return null;
        }

        const [isSupportedModule, recordSDK] = await Promise.all([
            import('@loomhq/record-sdk/is-supported'),
            import('@loomhq/record-sdk'),
        ]);

        const support = await isSupportedModule.isSupported();
        if (!support.supported) {
            throw new Error(support.error || 'loom-not-supported');
        }

        const createInstance = recordSDK.createInstance || recordSDK.setup;
        const instance = await createInstance({
            mode: 'standard',
            publicAppId: config.LoomPublicAppId,
            environment: config.LoomEnvironment || 'production',
            config: {insertButtonText: 'Share in Mattermost'},
        });

        const sdkButton = instance.configureButton({element: button});
        sdkButton.on('insert-click', (video) => {
            this.handleVideoInsert(video);
        });

        this.sdkButton = sdkButton;
        return sdkButton;
    }

    handleVideoInsert(video) {
        if (!video?.sharedUrl) {
            return;
        }

        if (this.onVideoInsert) {
            this.onVideoInsert(video, this.channelId, this.rootId);
            return;
        }

        this.postVideo(video, this.channelId, this.rootId);
    }

    async postVideo(video, channelId, rootId = '') {
        if (!channelId) {
            return;
        }

        const post = {
            channel_id: channelId,
            root_id: rootId,
            message: video.title || 'Loom video',
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
        if (!config.EnableRecordButton) {
            throw new Error('loom-record-disabled');
        }

        const sdkButton = await this.ensureSDK();
        if (!sdkButton) {
            throw new Error('loom-sdk-unavailable');
        }

        sdkButton.openPreRecordPanel();
    }

    getEmbedWidth() {
        const width = parseInt(this.config?.DefaultEmbedWidth, 10);
        return width > 0 ? width : DEFAULT_EMBED_WIDTH;
    }
}

export {BUTTON_ID};
