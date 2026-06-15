import {id as pluginId} from './manifest';

// Must be set before any dynamic import() loads Loom SDK chunks.
// eslint-disable-next-line no-undef
__webpack_public_path__ = `${window.basename || ''}/static/plugins/${pluginId}/`;

import LoomPlugin from './plugin';

window.registerPlugin(pluginId, new LoomPlugin());
