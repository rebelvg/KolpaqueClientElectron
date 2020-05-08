import * as SocketClient from 'socket.io-client';
import * as uuid from 'uuid';

import { addLogs } from './Logs';
import { twitchClient } from './ApiClients';
import { klpqServiceUrl } from './Globals';

export interface IUser {
  accessToken: string;
  refreshToken: string;
}

const io = SocketClient(klpqServiceUrl);

export const SOCKET_CLIENT_ID = uuid.v4();

io.on('user', (user: IUser) => {
  addLogs('socket_got_user', user);

  twitchClient.setAccessToken(user.accessToken);
  twitchClient.setRefreshToken(user.refreshToken);
});

io.on('connect', () => {
  addLogs('socket_connected');

  io.emit('request_id', SOCKET_CLIENT_ID);
});
