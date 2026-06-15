import {id as pluginId} from 'manifest';

export function getPluginURL() {
    const pluginURL = window.basename ? `${window.basename}/plugins/${pluginId}` :
        `/plugins/${pluginId}`;
    return pluginURL;
}

export function parseJSONResponse(response) {
    if (response.ok) {
        return response.json();
    }
    return response.text().then((text) => {
        throw new Error(text || response.statusText);
    });
}
