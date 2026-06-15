import {BUTTON_ID} from '../../client/loom_client';

import './root.css';

const React = window.React;
const PropTypes = window.PropTypes;

export default class Root extends React.PureComponent {
    static propTypes = {
        client: PropTypes.object.isRequired,
    }

    render() {
        return (
            <button
                id={BUTTON_ID}
                type='button'
                className='loom-record-button'
                aria-hidden='true'
                tabIndex={-1}
            />
        );
    }
}
