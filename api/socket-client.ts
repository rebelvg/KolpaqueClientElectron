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

export function run() {
  const io = SocketClient(KLPQ_SERVICE_URL);

  io.on('connect', () => {
    addLogs('socket_connected');

    io.emit('request_id', SOCKET_CLIENT_ID);
  });

  io.on('connect_error', (error) => {
    addLogs('connect_error', error);
  });

  io.on('twitch_user', (user: ITwitchUser) => {
    addLogs('socket_got_twitch_user', user);

    twitchClient.accessToken = user.accessToken;
    twitchClient.refreshToken = user.refreshToken;

    printNotification('Twitch', 'Login Successful');
  });

  io.on('youtube_user', (user: ITwitchUser) => {
    addLogs('socket_got_youtube_user', user);

    youtubeClient.accessToken = user.accessToken;
    youtubeClient.refreshToken = user.refreshToken;

    printNotification('Youtube', 'Login Successful');
  });

  io.on('klpq_user', (signedJwt: string) => {
    addLogs('socket_got_klpq_user', signedJwt);

    klpqServiceClient.setUser(signedJwt);

    printNotification('KLPQ Service', 'Login Successful');
  });
}
