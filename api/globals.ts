import { ChaturbateStreamService } from './stream-services/chaturbate';
import { CustomStreamService } from './stream-services/custom';
import { KolpaqueVpsHttpStreamService } from './stream-services/kolpaque-vps-http';
import { KolpaqueVpsRtmpStreamService } from './stream-services/kolpaque-vps-rtmp';
import {
  BaseStreamService,
  TwitchStreamService,
} from './stream-services/twitch';
import { YoutubeChannelStreamService } from './stream-services/youtube-channel';
import { YoutubeUserStreamService } from './stream-services/youtube-user';

export const TWITCH_CLIENT_ID = 'dk330061dv4t81s21utnhhdona0a91x';
export const CLIENT_VERSION = '0.5.0';

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  HTTP = 'http:',
  HTTPS = 'https:',
}

export enum ServiceNamesEnum {
  KLPQ_VPS_RTMP = 'klpq-vps-rtmp',
  KLPQ_VPS_HTTP = 'klpq-vps-http',
  TWITCH = 'twitch',
  YOUTUBE_USER = 'youtube-user',
  YOUTUBE_CHANNEL = 'youtube_channel',
  CHATURBATE = 'chaturbate',
  CUSTOM = 'custom',
}

export const ALLOWED_PROTOCOLS = [...Object.values(ProtocolsEnum)];

export const REGISTERED_SERVICES: BaseStreamService[] = [
  new KolpaqueVpsRtmpStreamService(),
  new KolpaqueVpsHttpStreamService(),
  new TwitchStreamService(),
  new YoutubeUserStreamService(),
  new YoutubeChannelStreamService(),
  new ChaturbateStreamService(),
  new CustomStreamService(),
];

export const klpqServiceUrl = 'https://client-api.klpq.men';
