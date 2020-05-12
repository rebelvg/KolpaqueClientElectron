import * as SocketClient from 'socket.io-client';
import * as uuid from 'uuid';

import { addLogs } from './Logs';
import { twitchClient, klpqServiceClient, youtubeClient } from './ApiClients';
import { klpqServiceUrl } from './Globals';

export interface ITwitchUser {
  accessToken: string;
  refreshToken: string;
}

const io = SocketClient(klpqServiceUrl);

export const SOCKET_CLIENT_ID = uuid.v4();

io.on('twitch_user', (user: ITwitchUser) => {
  addLogs('socket_got_twitch_user', user);

  twitchClient.setAccessToken(user.accessToken);
  twitchClient.setRefreshToken(user.refreshToken);
});

io.on('youtube_user', (user: ITwitchUser) => {
  addLogs('socket_got_youtube_user', user);

  youtubeClient.setAccessToken(user.accessToken);
  youtubeClient.setRefreshToken(user.refreshToken);
});

io.on('klpq_user', (signedJwt: string) => {
  addLogs('socket_got_klpq_user', signedJwt);

  klpqServiceClient.setUser(signedJwt);
});

io.on('connect', () => {
  addLogs('socket_connected');

  io.emit('request_id', SOCKET_CLIENT_ID);
});
