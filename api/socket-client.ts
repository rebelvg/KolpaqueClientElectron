import * as SocketClient from 'socket.io-client';
import * as uuid from 'uuid';

import { addLogs } from './logs';
import {
  twitchClient,
  klpqServiceClient,
  youtubeClient,
  KLPQ_SERVICE_URL,
} from './api-clients';
import { printNotification } from './notifications';

export interface ITwitchUser {
  accessToken: string;
  refreshToken: string;
}

const io = SocketClient(KLPQ_SERVICE_URL);

export const SOCKET_CLIENT_ID = uuid.v4();

export function run() {
  io.on('twitch_user', (user: ITwitchUser) => {
    addLogs('socket_got_twitch_user', user);

    twitchClient.setAccessToken(user.accessToken);
    twitchClient.setRefreshToken(user.refreshToken);

    printNotification('Twitch', 'Login Successful');
  });

  io.on('youtube_user', (user: ITwitchUser) => {
    addLogs('socket_got_youtube_user', user);

    youtubeClient.setAccessToken(user.accessToken);
    youtubeClient.setRefreshToken(user.refreshToken);

    printNotification('Youtube', 'Login Successful');
  });

  io.on('klpq_user', (signedJwt: string) => {
    addLogs('socket_got_klpq_user', signedJwt);

    klpqServiceClient.setUser(signedJwt);

    printNotification('KLPQ Service', 'Login Successful');
  });

  io.on('connect', () => {
    addLogs('socket_connected');

    io.emit('request_id', SOCKET_CLIENT_ID);
  });
}
