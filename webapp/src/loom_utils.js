const LOOM_SHARE_PATTERN = /https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/;

export function extractLoomShareURL(text = '') {
    const match = String(text).match(LOOM_SHARE_PATTERN);
    if (!match) {
        return '';
    }
    return `https://www.loom.com/share/${match[1]}`;
}

export function loomShareToEmbedURL(sharedUrl = '') {
    const match = String(sharedUrl).match(LOOM_SHARE_PATTERN);
    if (!match) {
        return '';
    }
    return `https://www.loom.com/embed/${match[1]}`;
}

export function getPostSharedURL(post) {
    if (!post) {
        return '';
    }

    const props = post.props || {};
    if (props.sharedUrl) {
        return props.sharedUrl;
    }
    if (props.shared_url) {
        return props.shared_url;
    }

    return extractLoomShareURL(post.message);
}
