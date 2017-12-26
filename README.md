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
- Auto Import
  - KLPQ Stream Service
  - Twitch
- Low Quality Playback
- Stream Auto-Start on Online Status
- Stream Auto-Restart
- Channel Searching
- Channel Renaming
- Play from Clipboard

## Usage User

### Requirements
- [Streamlink](https://github.com/streamlink/streamlink)

### Optionals
- [Youtube API Key](https://console.developers.google.com/apis/library/youtube.googleapis.com)

### Builds
- ftp://main.klpq.men:359/KolpaqueClientElectron/

## Usage Dev

### Requirements
- Node.js >= 8.
- Yarn.

### Setup
```
yarn install
```

### Run
```
yarn run react-build
yarn run start
```

### Run React Dev
```
yarn run start-react-dev
yarn run start-client-dev
```

### Build
```
yarn run react-build
yarn run build
```
