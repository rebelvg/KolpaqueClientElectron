import { ChaturbateStreamService } from './stream-services/chaturbate';
import { CustomStreamService } from './stream-services/custom';
import { KolpaqueVpsHttpStreamService } from './stream-services/kolpaque-vps-http';
import { KolpaqueVpsRtmpStreamService } from './stream-services/kolpaque-vps-rtmp';
import { TwitchStreamService } from './stream-services/twitch';
import { YoutubeChannelStreamService } from './stream-services/youtube-channel';
import { YoutubeUserStreamService } from './stream-services/youtube-user';
import { BaseStreamService } from './stream-services/_base';

export const CLIENT_VERSION = '0.5.0';

export const REGISTERED_SERVICES: BaseStreamService[] = [
  new KolpaqueVpsRtmpStreamService(),
  new KolpaqueVpsHttpStreamService(),
  new TwitchStreamService(),
  new YoutubeUserStreamService(),
  new YoutubeChannelStreamService(),
  new ChaturbateStreamService(),
  new CustomStreamService(),
];
