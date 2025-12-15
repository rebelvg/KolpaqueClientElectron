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
import { serviceManager } from './services';
import { ServiceNamesEnum } from './stream-services/_base';
import { kickClient } from './clients/kick';

export function run() {
  const io = SocketClient(KLPQ_SERVICE_URL, { timeout: 120 * 1000 });

  io.on('connect', () => {
    addLogs('info', 'socket_connected');

    io.emit('request_id', SOCKET_CLIENT_ID);
  });

  io.on('connect_error', (error) => {
    addLogs('warn', 'connect_error', error);
  });

  io.on('twitch_user', async (user: ITwitchUser) => {
    addLogs('info', 'socket_got_twitch_user', user);

    twitchClient.refreshToken = user.refreshToken;

    printNotification('Auth', 'Twitch Login Successful');

    ipcMain.emit('settings_check_tokens');

    await serviceManager.getInfo(ServiceNamesEnum.TWITCH);

    await serviceManager.doImport(ServiceNamesEnum.TWITCH, true);
  });

  io.on('kick_user', async (user: ITwitchUser) => {
    addLogs('info', 'socket_got_kick_user', user);

    kickClient.refreshToken = user.refreshToken;

    printNotification('Auth', 'Kick Login Successful');

    ipcMain.emit('settings_check_tokens');

    await serviceManager.getInfo(ServiceNamesEnum.KICK);

    await serviceManager.doImport(ServiceNamesEnum.KICK, true);
  });

  io.on('youtube_user', async (user: ITwitchUser) => {
    addLogs('info', 'socket_got_youtube_user', user);

    youtubeClient.refreshToken = user.refreshToken;

    printNotification('Auth', 'Youtube Login Successful');

    ipcMain.emit('settings_check_tokens');

    await serviceManager.getInfo(ServiceNamesEnum.YOUTUBE_USER);

    await serviceManager.doImport(ServiceNamesEnum.YOUTUBE_USER, true);
  });

  io.on('klpq_user', async (signedJwt: string) => {
    addLogs('info', 'socket_got_klpq_user', signedJwt);

    klpqServiceClient.jwtToken = signedJwt;

    printNotification('Auth', 'KLPQ Login Successful');

    ipcMain.emit('settings_check_tokens');

    await serviceManager.getInfo(ServiceNamesEnum.KLPQ_VPS_RTMP);

    await serviceManager.doImport(ServiceNamesEnum.KLPQ_VPS_RTMP, true);
  });
}
