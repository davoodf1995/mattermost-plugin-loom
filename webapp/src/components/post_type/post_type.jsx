import {getPluginURL, parseJSONResponse, pluginFetch} from '../../utils';
import {getPostSharedURL, loomShareToEmbedURL} from '../../loom_utils';

import './post_type.css';

const React = window.React;
const PropTypes = window.PropTypes;

const DEFAULT_WIDTH = 480;

export default class PostType extends React.PureComponent {
    static propTypes = {
        post: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props);
        this.embedWidth = DEFAULT_WIDTH;
    }

    componentDidMount() {
        this.loadConfig();
    }

    loadConfig() {
        return pluginFetch('/config', {
            headers: {Accept: 'application/json'},
        }).then(parseJSONResponse).then((config) => {
            const width = parseInt(config?.DefaultEmbedWidth, 10);
            if (width > 0) {
                this.embedWidth = width;
                this.forceUpdate();
            }
        }).catch(() => {
            this.embedWidth = DEFAULT_WIDTH;
        });
    }

    render() {
        const sharedUrl = getPostSharedURL(this.props.post);
        const embedUrl = loomShareToEmbedURL(sharedUrl);
        const title = this.props.post?.props?.title || sharedUrl;

        if (!embedUrl) {
            return (
                <div className='loom-post'>
                    <span className='loom-post__loading'>{'Loom video unavailable'}</span>
                </div>
            );
        }

        return (
            <div className='loom-post'>
                <div
                    className='loom-post__frame-wrap'
                    style={{maxWidth: this.embedWidth}}
                >
                    <iframe
                        className='loom-post__frame'
                        src={embedUrl}
                        title={title}
                        frameBorder='0'
                        allowFullScreen={true}
                    />
                </div>
                {sharedUrl && sharedUrl !== this.props.post?.message && (
                    <a
                        className='loom-post__link'
                        href={sharedUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        {title}
                    </a>
                )}
            </div>
        );
    }
}
