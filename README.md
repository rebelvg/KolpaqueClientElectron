# KolpaqueClientElectron

## Overview
Electron version of Kolpaque Client **React Edition**.

Multiplatform desktop app for tracking statuses of your favorite channels on various stream services and piping them with Streamlink into any desktop videoplayer (MPC, VLC, etc).

## Features
- Multiplatform (Win/Mac/Linux)
- Services Support
  - KLPQ Stream Service
  - Twitch
  - Youtube (with your own API key)
- Notifications
- Auto-Import
  - KLPQ Stream Service
  - Twitch
- Low Quality Playback
- Stream Auto-Start on Online Status
- Stream Auto-Restart
- Channel Searching
- Channel Sorting
- Channel Renaming
- Pinned Channels
- Play from Clipboard
- Tray Menu
- Shortcuts (Ctrl - LQ, Shift - Auto-Restart)
- Night Mode (dark toned theme)
- Client and Streamlink Update Checks

## Planned Features
- View Modes (detailed, list, etc)
- More Stream Services

## Usage User

### Requirements
- [Streamlink](https://github.com/streamlink/streamlink) (with RTMPDump)

### Optionals
- [Youtube API Key](https://console.developers.google.com/apis/library/youtube.googleapis.com)

### Builds
> https://github.com/rebelvg/KolpaqueClientElectron/releases

## Usage Dev

### Requirements
- Node.js >= 8
- Yarn

### Setup
```
yarn install
```

### Run
```
yarn run react-build
yarn run start
```

### Run Dev
```
yarn run start-react-dev
yarn run start-client-dev
```

### Build
```
yarn run build
```
