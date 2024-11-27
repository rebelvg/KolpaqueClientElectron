import * as SocketClient from 'socket.io-client';

import { addLogs } from './logs';
import {
  twitchClient,
  klpqServiceClient,
  youtubeClient,
  KLPQ_SERVICE_URL,
  SOCKET_CLIENT_ID,
  ITwitchUser,
} from './api-clients';
import { printNotification } from './notifications';
import { ipcMain } from 'electron';

export function run() {
  const io = SocketClient(KLPQ_SERVICE_URL, { timeout: 120 * 1000 });

  io.on('connect', () => {
    addLogs('info', 'socket_connected');

    io.emit('request_id', SOCKET_CLIENT_ID);
  });

  io.on('connect_error', (error) => {
    addLogs('error', 'connect_error', error);
  });

  io.on('twitch_user', (user: ITwitchUser) => {
    addLogs('info', 'socket_got_twitch_user', user);

    twitchClient.refreshToken = user.refreshToken;

    printNotification('Twitch', 'Login Successful');

    ipcMain.emit('settings_check_tokens');
  });

  io.on('youtube_user', (user: ITwitchUser) => {
    addLogs('info', 'socket_got_youtube_user', user);

    youtubeClient.accessToken = user.accessToken;
    youtubeClient.refreshToken = user.refreshToken;

    printNotification('Youtube', 'Login Successful');

    ipcMain.emit('settings_check_tokens');
  });

  io.on('klpq_user', (signedJwt: string) => {
    addLogs('info', 'socket_got_klpq_user', signedJwt);

    klpqServiceClient.jwtToken = signedJwt;

    printNotification('KLPQ Service', 'Login Successful');

    ipcMain.emit('settings_check_tokens');
  });
}
