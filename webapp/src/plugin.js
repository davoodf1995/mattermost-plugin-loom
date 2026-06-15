import {FormattedMessage} from 'react-intl';
import {Client4} from 'mattermost-redux/client';
import {getConfig} from 'mattermost-redux/selectors/entities/general';

import PostType from './components/post_type/post_type';
import Root from './components/root';
import LoomClient from './client/loom_client';
import {getPluginURL} from './utils';

const loomIcon = <i className='icon fa fa-video-camera'/>;

function getErrorMessage(error) {
    switch (error?.message) {
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
    default:
        return 'Could not start Loom recording.';
    }
}

export default class LoomPlugin {
    initialize(registry, store) {
        const config = getConfig(store.getState());
        if (config?.SiteURL) {
            Client4.setUrl(config.SiteURL);
        }

        const client = new LoomClient();

        const startRecording = (channelId = '', rootId = '') => {
            client.startRecording(channelId, rootId).catch((error) => {
                // eslint-disable-next-line no-alert
                window.alert(getErrorMessage(error));
            });
        };

        const PostTypeWrapper = (props) => (
            <PostType {...props}/>
        );

        registry.registerRootComponent(() => (
            <Root client={client}/>
        ));
        registry.registerPostTypeComponent('custom_loom', PostTypeWrapper);
        registry.registerFileUploadMethod(
            loomIcon,
            () => startRecording(),
            <FormattedMessage
                id='plugin.loom.upload'
                defaultMessage='Record Loom video'
            />,
        );
        registry.registerSlashCommandWillBePostedHook((message, args) => {
            if (message.trim() === '/loom record') {
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
            iconUrl: `${getPluginURL()}/public/loom-icon.svg`,
            action: (channelId) => startRecording(channelId),
            tooltipText: (
                <FormattedMessage
                    id='plugin.loom.app_bar'
                    defaultMessage='Record Loom video'
                />
            ),
        });
    }
}
