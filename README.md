# KolpaqueClientElectron

## Overview

Electron version of Kolpaque Client **React Edition**.

Multiplatform desktop app for tracking statuses of your favorite channels on various stream services and piping them with Streamlink into any desktop videoplayer (MPC, VLC, etc).

## Automated builds

- [GitHub Actions](https://github.com/rebelvg/KolpaqueClientElectron/actions/workflows/release.yml)

Pushing a tag builds Linux x64, Windows x64, and macOS x64/arm64 ZIPs
with Node.js 22, then publishes them together in a GitHub release for that tag.
The existing `yarn run release` command pushes the version tag and triggers this
workflow. Branch pushes and pull requests do not trigger release builds.

No Azure connection or personal access token is needed. Build jobs have
`contents: read`; only the publishing job has `contents: write`, using the
repository's automatic `GITHUB_TOKEN`. Re-running a tag's workflow replaces
assets with matching names. Releases are published without generated notes and
are not marked as prereleases, matching the previous Azure release setup.

Disable the old Azure build and release pipelines before pushing a new tag to
avoid both systems publishing the same release.

## Features

- Multiplatform (Win/Mac/Linux)
- Services Support
  - Kolpaque Stream Service
  - Twitch (only after login via Twitch)
  - Youtube (only after you agree to [youtube's terms of use](https://www.youtube.com/t/terms), located in the settings menu)
  - Anything Streamlink Supports (warning, high cpu usage and slow detection)
- Notifications
- Auto-Import
  - Twitch
  - Kolpaque Stream Service
- Low Quality Playback
- Stream Auto-Start on Online Status (with confirmation option)
- Stream Auto-Restart
- Channel Searching
- Channel Sorting
- Channel Renaming
- Pinned Channels
- Play from Clipboard
- Tray Menu
- Shortcuts (Ctrl - LQ, Shift - Auto-Restart)
- Night Mode (dark theme)
- Client and Streamlink Update Checks

## Planned Features

- View Modes (detailed, list, etc)
- More Stream Services
- Stream Title Info
- Streamer Name for Kolpaque Service

## Usage User

### Requirements

- [Streamlink](https://github.com/streamlink/streamlink) (with RTMPDump)

### Builds

> https://github.com/rebelvg/KolpaqueClientElectron/releases

## Usage Dev

### Requirements

- Node.js LTS
- Yarn

### Setup

```
yarn install
```

### Run

```
yarn run start
```

### Pack

```
yarn run package
```

xhost +local:$(id -un)

podman build -t electron-dev .

podman run --rm -it \
--name electron-dev \
--userns=keep-id \
--user "$(id -u):$(id -g)" \
\
-e XDG_RUNTIME_DIR \
-e WAYLAND_DISPLAY \
-e DISPLAY= \
-e DBUS_SESSION_BUS_ADDRESS \
\
-e ELECTRON_OZONE_PLATFORM_HINT=wayland \
-e OZONE_PLATFORM=wayland \
-e QT_QPA_PLATFORM=wayland \
-e ELECTRON_ENABLE_WAYLAND=1 \
-e ELECTRON_USE_WAYLAND=1 \
\
-v "$XDG_RUNTIME_DIR:$XDG_RUNTIME_DIR" \
--device /dev/dri \
-v /dev/dri:/dev/dri \
\
-v "$PWD:/workspace" \
-w /workspace \
electron-dev

podman run --rm -it \
--name electron-dev-weston \
--userns=keep-id \
--user "$(id -u):$(id -g)" \
\
-e DISPLAY \
-e XAUTHORITY=/tmp/.Xauthority \
\
-v "$(xauth info | awk '/Authority file/ {print $3}'):/tmp/.Xauthority:ro" \
-v /tmp/.X11-unix:/tmp/.X11-unix \
\
--device /dev/dri \
-v /dev/dri:/dev/dri \
\
-v "$PWD:/workspace" \
-w /workspace \
electron-dev
