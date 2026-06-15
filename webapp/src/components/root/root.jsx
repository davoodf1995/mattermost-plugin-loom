import {BUTTON_ID} from '../../client/loom_client';

import LoomRecorderOverlay from './recorder_overlay';

import './root.css';

const React = window.React;
const PropTypes = window.PropTypes;

export default class Root extends React.PureComponent {
    static propTypes = {
        client: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props);
        this.state = {
            overlay: null,
        };
    }

    componentDidMount() {
        this.props.client.setOverlayListener((overlay) => {
            this.setState({overlay});
        });
    }

    componentWillUnmount() {
        this.props.client.setOverlayListener(null);
    }

    closeOverlay = () => {
        this.setState({overlay: null});
        this.props.client.clearOverlay();
    }

    render() {
        return (
            <>
                <button
                    id={BUTTON_ID}
                    type='button'
                    className='loom-record-button'
                    aria-hidden='true'
                    tabIndex={-1}
                />
                {this.state.overlay && (
                    <LoomRecorderOverlay
                        {...this.state.overlay}
                        onClose={this.closeOverlay}
                    />
                )}
            </>
        );
    }
}
