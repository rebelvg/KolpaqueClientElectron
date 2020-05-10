# KolpaqueClientElectron

## Overview

Electron version of Kolpaque Client **React Edition**.

Multiplatform desktop app for tracking statuses of your favorite channels on various stream services and piping them with Streamlink into any desktop videoplayer (MPC, VLC, etc).

## Features

- Multiplatform (Win/Mac/Linux)
- Services Support
  - KLPQ Stream Service
  - Twitch (have to login via Twitch)
  - Youtube (only after you agree to [youtube's terms of use](https://www.youtube.com/t/terms), located in the settings)
  - Anything Streamlink Supports
- Notifications
- Auto-Import
  - KLPQ Stream Service
  - Twitch
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
- Streamer Name for KLPQ Service

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

### Build

```
yarn run build
```
