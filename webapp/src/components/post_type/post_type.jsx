import {oembed} from '@loomhq/loom-embed';

import {getPluginURL, parseJSONResponse} from '../../utils';

import './post_type.css';

const React = window.React;
const PropTypes = window.PropTypes;

export default class PostType extends React.PureComponent {
    static propTypes = {
        post: PropTypes.object.isRequired,
        embedWidth: PropTypes.number,
    }

    constructor(props) {
        super(props);
        this.state = {
            embedHTML: '',
            loading: true,
            error: '',
        };
        this.containerRef = React.createRef();
    }

    componentDidMount() {
        this.loadConfig().then(() => this.loadEmbed());
    }

    loadConfig() {
        return fetch(`${getPluginURL()}/config`, {
            headers: {Accept: 'application/json'},
            credentials: 'same-origin',
        }).then(parseJSONResponse).then((config) => {
            const width = parseInt(config?.DefaultEmbedWidth, 10);
            if (width > 0) {
                this.embedWidth = width;
            }
        }).catch(() => {
            this.embedWidth = 480;
        });
    }

    componentDidUpdate(prevProps) {
        const prevURL = prevProps.post?.props?.sharedUrl;
        const nextURL = this.props.post?.props?.sharedUrl;
        if (prevURL !== nextURL) {
            this.loadEmbed();
        }
    }

    async loadEmbed() {
        const sharedUrl = this.props.post?.props?.sharedUrl;
        if (!sharedUrl) {
            this.setState({loading: false, error: 'missing-url'});
            return;
        }

        this.setState({loading: true, error: ''});

        try {
            const width = this.embedWidth || this.props.embedWidth || 480;
            const result = await oembed(sharedUrl, {width});
            this.setState({
                embedHTML: result?.html || '',
                loading: false,
            });
        } catch (error) {
            this.setState({
                loading: false,
                error: 'embed-failed',
            });
        }
    }

    renderFallback() {
        const sharedUrl = this.props.post?.props?.sharedUrl;
        if (!sharedUrl) {
            return null;
        }

        return (
            <div className='loom-post__fallback'>
                <a
                    href={sharedUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {this.props.post?.props?.title || sharedUrl}
                </a>
            </div>
        );
    }

    render() {
        const {embedHTML, loading, error} = this.state;

        if (loading) {
            return (
                <div className='loom-post'>
                    <span className='loom-post__loading'>{'Loading Loom video...'}</span>
                </div>
            );
        }

        if (error || !embedHTML) {
            return (
                <div className='loom-post'>
                    {this.renderFallback()}
                </div>
            );
        }

        return (
            <div
                className='loom-post'
                ref={this.containerRef}
                dangerouslySetInnerHTML={{__html: embedHTML}}
            />
        );
    }
}
