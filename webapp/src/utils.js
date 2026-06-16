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

const LOOM_HOST_PATTERN = /(^|\.)loom\.com/i;

function applyLoomIframeReferrerPolicy(iframe) {
    if (!iframe?.src || !LOOM_HOST_PATTERN.test(iframe.src)) {
        return;
    }
    iframe.referrerPolicy = 'origin';
}

// Loom validates the embedding domain via the Referer header. Mattermost sets
// Referrer-Policy: no-referrer, which strips Referer on cross-origin iframes → 403.
export function ensureLoomReferrerSupport() {
    if (ensureLoomReferrerSupport.initialized) {
        return;
    }
    ensureLoomReferrerSupport.initialized = true;

    if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = 'referrer';
        meta.content = 'origin';
        document.head.appendChild(meta);
    }

    document.querySelectorAll('iframe').forEach(applyLoomIframeReferrerPolicy);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }
                if (node.tagName === 'IFRAME') {
                    applyLoomIframeReferrerPolicy(node);
                }
                node.querySelectorAll?.('iframe').forEach(applyLoomIframeReferrerPolicy);
            });
        });
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
}
ensureLoomReferrerSupport.initialized = false;

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
