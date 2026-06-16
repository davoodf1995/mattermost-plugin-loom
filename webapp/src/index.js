import {id as pluginId} from './manifest';
import {ensureLoomReferrerSupport} from './utils';
import LoomPlugin from './plugin';

// Must be set before any dynamic import() loads Loom SDK chunks.
// eslint-disable-next-line no-undef
__webpack_public_path__ = `${window.basename || ''}/static/plugins/${pluginId}/`;

// Run before the SDK bundle loads so Loom iframes send the Referer header.
ensureLoomReferrerSupport();

window.registerPlugin(pluginId, new LoomPlugin());
