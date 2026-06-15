import {FormattedMessage} from 'react-intl';
import {Client4} from 'mattermost-redux/client';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/channels';
import {getConfig} from 'mattermost-redux/selectors/entities/general';

import PostType from './components/post_type';
import Root from './components/root';
import LoomClient from './client/loom_client';
import {getPluginURL, normalizeChannelId} from './utils';

const React = window.React;

const loomIcon = (
    <img
        src={`${getPluginURL()}/public/loom.png`}
        alt='Loom'
        style={{width: '24px', height: '24px'}}
    />
);

function getErrorMessage(error) {
    const message = error?.message || '';
    switch (message) {
    case 'loom-not-configured':
        return 'Loom is not configured. Ask your admin to add the Loom Public App ID in System Console → Plugins → Loom.';
    case 'loom-record-disabled':
        return 'Loom recording is disabled in plugin settings.';
    case 'loom-sdk-unavailable':
        return 'Loom recorder could not be loaded. Refresh the page and try again.';
    case 'loom-not-supported':
    case 'incompatible-browser':
    case 'third-party-cookies-disabled':
    case 'no-media-streams-support':
        return 'Loom recording is not supported in this browser. Try Chrome or Firefox with third-party cookies enabled.';
    case 'loom-plugin-unavailable':
        return 'Loom plugin server is not responding. Disable and re-enable the plugin, then hard-refresh the browser (Ctrl+Shift+R).';
    default:
        return message || 'Could not start Loom recording.';
    }
}

class LoomRoot extends React.PureComponent {
    render() {
        return (
            <Root client={this.props.client}/>
        );
    }
}

export default class LoomPlugin {
    initialize(registry, store) {
        const config = getConfig(store.getState());
        if (config?.SiteURL) {
            Client4.setUrl(config.SiteURL);
        }

        const client = new LoomClient();
        const pluginURL = getPluginURL();

        const resolveChannelId = (channelLike = '') => {
            return normalizeChannelId(channelLike) || getCurrentChannelId(store.getState()) || '';
        };

        const startRecording = (channelLike = '', rootId = '') => {
            const resolvedChannelId = resolveChannelId(channelLike);
            if (!resolvedChannelId) {
                window.alert('Open a channel before recording a Loom video.');
                return;
            }

            client.startRecording(resolvedChannelId, rootId).catch((error) => {
                client.resetSDK();
                // eslint-disable-next-line no-alert
                window.alert(getErrorMessage(error));
            });
        };

        registry.registerRootComponent(() => (
            <LoomRoot client={client}/>
        ));
        registry.registerPostTypeComponent('custom_loom', PostType);
        registry.registerFileUploadMethod(
            loomIcon,
            () => startRecording(),
            <FormattedMessage
                id='plugin.loom.upload'
                defaultMessage='Record Loom video'
            />,
        );
        registry.registerSlashCommandWillBePostedHook((message, args) => {
            const trimmed = message.trim();
            if (trimmed === '/loom record') {
                startRecording(args.channel_id, args.root_id);
                return {};
            }
            return {message, args};
        });
        registry.registerMainMenuAction(
            <FormattedMessage
                id='plugin.loom.main_menu'
                defaultMessage='Record Loom video'
            />,
            () => startRecording(),
            loomIcon,
        );
        registry.registerAppBarComponent({
            iconUrl: `${pluginURL}/public/loom.png`,
            action: (channelLike) => startRecording(channelLike),
            tooltipText: (
                <FormattedMessage
                    id='plugin.loom.app_bar'
                    defaultMessage='Record Loom video'
                />
            ),
        });
        registry.registerChannelHeaderButtonAction(
            loomIcon,
            (channel) => startRecording(channel),
            'Record Loom video',
            'Record Loom video',
        );
    }
}
