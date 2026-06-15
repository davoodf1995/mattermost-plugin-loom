import {Client4} from 'mattermost-redux/client';

import {id as pluginId} from 'manifest';

export function getPluginURL() {
    const pluginURL = window.basename ? `${window.basename}/plugins/${pluginId}` :
        `/plugins/${pluginId}`;
    return pluginURL;
}

export function normalizeChannelId(value) {
    if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
    }
    if (value && typeof value === 'object' && typeof value.id === 'string' && value.id !== '') {
        return value.id;
    }
    return '';
}

export function parseJSONResponse(response) {
    if (response.ok) {
        return response.json();
    }
    return response.text().then((text) => {
        let message = text || response.statusText;
        try {
            const payload = JSON.parse(text);
            if (payload.message) {
                message = payload.message;
            }
        } catch {
            // Keep plain-text error body.
        }
        throw new Error(message);
    });
}

export function pluginFetch(path, options = {}) {
    const method = options.method || 'GET';
    const clientHeaders = Client4.getOptions({method, body: options.body}).headers || {};

    return fetch(`${getPluginURL()}${path}`, {
        ...options,
        headers: {
            ...clientHeaders,
            ...options.headers,
        },
        credentials: 'same-origin',
    });
}

export function withTimeout(promise, ms, message) {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
            reject(new Error(message));
        }, ms);

        promise.then(
            (value) => {
                window.clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                window.clearTimeout(timer);
                reject(error);
            },
        );
    });
}
