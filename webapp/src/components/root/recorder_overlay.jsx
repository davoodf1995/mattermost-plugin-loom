import './recorder_overlay.css';

const React = window.React;
const PropTypes = window.PropTypes;

const LOOM_RECORD_URL = 'https://www.loom.com/record';

export default class LoomRecorderOverlay extends React.PureComponent {
    static propTypes = {
        title: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        error: PropTypes.string,
        showFallback: PropTypes.bool,
        onClose: PropTypes.func.isRequired,
    }

    openLoomSite = () => {
        window.open(LOOM_RECORD_URL, '_blank', 'noopener,noreferrer');
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
                            {'If the Loom panel does not appear, your Mattermost admin must allow '}
                            <strong>{'www.loom.com'}</strong>
                            {' in Content-Security-Policy '}
                            {'(connect-src, frame-src) and register '}
                            <strong>{window.location.origin}</strong>
                            {' at dev.loom.com.'}
                        </p>
                    )}
                    <div className='loom-overlay__actions'>
                        {this.props.showFallback && (
                            <button
                                type='button'
                                className='loom-overlay__button loom-overlay__button--primary'
                                onClick={this.openLoomSite}
                            >
                                {'Record on Loom.com'}
                            </button>
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
