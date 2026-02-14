import { io } from 'socket.io-client';

import { logger } from './logs';
import {
  twitchClient,
  kolpaqueClientServiceClient,
  youtubeClient,
  KLPQ_SERVICE_URL,
  SOCKET_CLIENT_ID,
  ITwitchUser,
  refreshIntegrationState,
} from './api-clients';
import { printNotification } from './notifications';
import { ipcMain } from 'electron';
import { serviceManager } from './services';
import { ServiceNamesEnum } from './stream-services/_base';
import { kickClient } from './clients/kick';

export function init() {
  const client = io(KLPQ_SERVICE_URL, { timeout: 120 * 1000 });

  client.on('connect', () => {
    logger('info', 'socket_connected');

    client.emit('request_id', SOCKET_CLIENT_ID);
  });

  client.on('connect_error', (error) => {
    logger('warn', 'connect_error', error);
  });

  client.on('twitch_user', async (user: ITwitchUser) => {
    logger('info', 'socket_got_twitch_user', user);

    twitchClient.refreshToken = user.refreshToken;

    printNotification('Auth', 'Twitch Login Successful');

    void refreshIntegrationState('app').catch();

    await serviceManager.info(ServiceNamesEnum.TWITCH);

    await serviceManager.import(ServiceNamesEnum.TWITCH, true);
  });

  client.on('kick_user', async (user: ITwitchUser) => {
    logger('info', 'socket_got_kick_user', user);

    kickClient.refreshToken = user.refreshToken;

    printNotification('Auth', 'Kick Login Successful');

    void refreshIntegrationState('app').catch();

    await serviceManager.info(ServiceNamesEnum.KICK);

    await serviceManager.import(ServiceNamesEnum.KICK, true);
  });

  client.on('youtube_user', async (user: ITwitchUser) => {
    logger('info', 'socket_got_youtube_user', user);

    youtubeClient.refreshToken = user.refreshToken;

    printNotification('Auth', 'Youtube Login Successful');

    void refreshIntegrationState('app').catch();

    await serviceManager.info(ServiceNamesEnum.YOUTUBE_USER);

    await serviceManager.import(ServiceNamesEnum.YOUTUBE_USER, true);
  });

  client.on('klpq_user', async (signedJwt: string) => {
    logger('info', 'socket_got_klpq_user', signedJwt);

    kolpaqueClientServiceClient.jwtToken = signedJwt;

    printNotification('Auth', 'Kolpaque Login Successful');

    void refreshIntegrationState('app').catch();

    await serviceManager.info(ServiceNamesEnum.KOLPAQUE_RTMP);

    await serviceManager.import(ServiceNamesEnum.KOLPAQUE_RTMP, true);
  });
}
