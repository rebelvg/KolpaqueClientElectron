import * as fs from 'fs';
import * as path from 'path';

import { ChaturbateStreamService } from './stream-services/chaturbate';
import { customStreamService } from './stream-services/custom';
import {
  KolpaqueVpsHttpStreamService,
  KolpaqueVpsHttpStreamServiceNew,
} from './stream-services/kolpaque-vps-http';
import {
  KolpaqueVpsMpdStreamService,
  KolpaqueVpsMpdStreamServiceNew,
} from './stream-services/kolpaque-vps-mpd';
import { KolpaqueVpsRtmpStreamService } from './stream-services/kolpaque-vps-rtmp';
import { twitchStreamService } from './stream-services/twitch';
import { YoutubeChannelStreamService } from './stream-services/youtube-channel';
import { YoutubeUserStreamService } from './stream-services/youtube-user';
import { BaseStreamService } from './stream-services/_base';
import { YoutubeUsernameStreamService } from './stream-services/youtube-username';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), {
    encoding: 'utf-8',
  }),
);

export const CLIENT_VERSION: string = packageJson.version;

export const REGISTERED_SERVICES: BaseStreamService[] = [
  new KolpaqueVpsHttpStreamServiceNew(),
  new KolpaqueVpsMpdStreamServiceNew(),
  new KolpaqueVpsRtmpStreamService(),
  new KolpaqueVpsHttpStreamService(),
  new KolpaqueVpsMpdStreamService(),
  twitchStreamService,
  new YoutubeUserStreamService(),
  new YoutubeChannelStreamService(),
  new ChaturbateStreamService(),
  customStreamService,
  new YoutubeUsernameStreamService(),
];
