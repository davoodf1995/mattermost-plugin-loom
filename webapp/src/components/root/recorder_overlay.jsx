import './recorder_overlay.css';

const React = window.React;
const PropTypes = window.PropTypes;

const LOOM_CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb';
const LOOM_DOWNLOAD_URL = 'https://www.atlassian.com/software/loom/download';

export default class LoomRecorderOverlay extends React.PureComponent {
    static propTypes = {
        title: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        error: PropTypes.string,
        showFallback: PropTypes.bool,
        onClose: PropTypes.func.isRequired,
    }

    openChromeExtension = () => {
        window.open(LOOM_CHROME_EXTENSION_URL, '_blank', 'noopener,noreferrer');
    }

    openDownloadPage = () => {
        window.open(LOOM_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
    }

    render() {
        return (
            <div className='loom-overlay'>
                <div className='loom-overlay__panel'>
                    <h3 className='loom-overlay__title'>{this.props.title}</h3>
                    <p className='loom-overlay__message'>{this.props.message}</p>
                    {this.props.error && (
                        <p className='loom-overlay__error'>{this.props.error}</p>
                    )}
                    {this.props.showFallback && (
                        <p className='loom-overlay__hint'>
                            {'Loom has no web record page. Use the Chrome extension or desktop app, then paste the '}
                            <strong>{'loom.com/share/...'}</strong>
                            {' link in Mattermost. For in-app recording, your admin must allow '}
                            <strong>{'www.loom.com'}</strong>
                            {' in CSP and register '}
                            <strong>{window.location.origin}</strong>
                            {' at dev.loom.com.'}
                        </p>
                    )}
                    <div className='loom-overlay__actions'>
                        {this.props.showFallback && (
                            <>
                                <button
                                    type='button'
                                    className='loom-overlay__button loom-overlay__button--primary'
                                    onClick={this.openChromeExtension}
                                >
                                    {'Get Loom for Chrome'}
                                </button>
                                <button
                                    type='button'
                                    className='loom-overlay__button'
                                    onClick={this.openDownloadPage}
                                >
                                    {'Download Loom app'}
                                </button>
                            </>
                        )}
                        <button
                            type='button'
                            className='loom-overlay__button'
                            onClick={this.props.onClose}
                        >
                            {'Close'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
