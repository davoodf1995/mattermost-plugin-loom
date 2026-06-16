# mattermost-plugin-loom

Mattermost plugin for recording and sharing [Loom](https://www.loom.com) videos directly in channels.

**Requires Mattermost Server v11.0.0 or later.**

## Features

- **Record Loom videos** from the post textbox, app bar, or main menu using the [Loom Record SDK](https://dev.loom.com/docs/record-sdk/details/api)
- **Rich inline embeds** for Loom share links via the [Loom Embed SDK](https://dev.loom.com/docs/embed-sdk/getting-started)
- **Automatic link upgrade** — paste `https://www.loom.com/share/...` and the plugin converts it to a rich player
- **Admin configuration** for Public App ID, SDK environment, and embed width

## Setup

### 1. Create a Loom SDK application

1. Sign in at [dev.loom.com](https://dev.loom.com) and create a developer account
2. Create an **SDK Standard** application
3. Add your Mattermost site URL as an allowed domain (e.g. `https://mattermost.example.com`)
4. For local development, use the **sandbox** app and add `http://localhost:8065`
5. Copy the **Public App ID**

### 2. Configure the plugin

1. Upload and enable the plugin (see [Installation](#installation))
2. Go to **System Console → Plugins → Loom**
3. Paste your **Loom Public App ID**
4. Set **Loom SDK Environment** (`production` for live servers)
5. Save and reload the web client

### 3. Content Security Policy (if needed)

If Loom embeds do not load, add these domains to your Mattermost CSP settings:

- `https://www.loom.com`
- `https://cdn.loom.com`

See [Loom CSP documentation](https://dev.loom.com/docs/record-sdk/details/content-security-policy) for details.

## Usage

| Action | How |
|--------|-----|
| Record a video | Click **Record Loom video** in the post textbox (+), app bar, or main menu |
| Share a link | Paste a Loom share URL in a channel message |
| Help | `/loom help` |

After recording, click **Share in Mattermost** in the Loom preview to post the video to the current channel.

## Limitations

- Loom has **no web record page** (`loom.com/record` does not exist). Fallback recording uses the Chrome extension or desktop app
- Loom recording requires a supported browser (Chrome, Firefox, Edge) with **third-party cookies** enabled
- Recording is **desktop only** — mobile browsers are not supported by the Loom SDK
- Your Mattermost domain must be registered in the Loom developer portal
- The Loom Record SDK loads asynchronously and is not available during server-side rendering

## Installation

### From a release

1. Download **`com.mattermost.loom-1.0.0.tar.gz`** from [GitHub Releases](https://github.com/davoodf1995/mattermost-plugin-loom/releases) (Assets section — **not** “Source code”)
2. **System Console → Plugins → Upload**
3. Enable the plugin and configure your Public App ID

### Build locally

```bash
make dist
```

Upload `dist/com.mattermost.loom-1.0.0.tar.gz` via System Console.

### Deploy to a running server

```bash
export MM_SERVICESETTINGS_SITEURL=https://your-mattermost-url
export MM_ADMIN_TOKEN=your-personal-access-token
make deploy
```

## Development

```bash
make dist          # build plugin bundle
make deploy        # deploy to local Mattermost
make test          # run Go tests
cd webapp && npm run lint
```

## Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions builds the plugin bundle and publishes it to the release.

## Support

- [Report issues](https://github.com/davoodf1995/mattermost-plugin-loom/issues)
- [Loom SDK API reference](https://dev.loom.com/docs/record-sdk/details/api)

## License

Apache 2.0
