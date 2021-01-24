import { Channel } from '../channel-class';

export enum ServiceNamesEnum {
  KLPQ_VPS_RTMP = 'klpq-vps-rtmp',
  KLPQ_VPS_HTTP = 'klpq-vps-http',
  TWITCH = 'twitch',
  YOUTUBE_USER = 'youtube-user',
  YOUTUBE_CHANNEL = 'youtube-channel',
  CHATURBATE = 'chaturbate',
  CUSTOM = 'custom',
}

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  HTTP = 'http:',
  HTTPS = 'https:',
}

export abstract class BaseStreamService {
  public name: ServiceNamesEnum;
  public protocols: ProtocolsEnum[];
  public hosts: string[];
  public paths: RegExp[];
  public embedLink: (channel: Channel) => string;
  public chatLink: (channel: Channel) => string;
  public icon: Buffer;
  public play: (channel: Channel) => { playLink: string; params: string[] };
  public playLQ: (channel: Channel) => { playLink: string; params: string[] };
  public checkLiveTimeout = 0;
  public checkLiveConfirmation = 0;
  public checkChannels: (
    channels: Channel[],
    printBalloon: boolean,
  ) => Promise<void>;
  public getInfo: (channels: Channel[]) => Promise<void>;
}
