import {BUTTON_ID} from '../../client/loom_client';

const React = window.React;
const PropTypes = window.PropTypes;

export default class Root extends React.PureComponent {
    static propTypes = {
        client: PropTypes.object.isRequired,
    }

    componentDidMount() {
        this.props.client.ensureSDK().catch(() => {
            // Browser may not support Loom SDK; UI entry points handle errors on click.
        });
    }

    render() {
        return (
            <button
                id={BUTTON_ID}
                type='button'
                className='loom-record-button'
                aria-hidden='true'
            />
        );
    }
}
