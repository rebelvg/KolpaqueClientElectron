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

abstract class AbstractStreamService {
  public name: ServiceNamesEnum;
  public protocols: ProtocolsEnum[];
  public hosts: string[];
  public paths: RegExp[];
  public embedLink: (channel: Channel) => string;
  public chatLink: (channel: Channel) => string;
  public icon: Buffer;
  public play: (channel: Channel) => { playLink: string; params: string[] };
  public playLQ: (channel: Channel) => { playLink: string; params: string[] };
  public checkLiveTimeout: number;
  public checkLiveConfirmation: number;
  public getStats: (
    channels: Channel[],
    printBalloon: boolean,
  ) => Promise<void>;
  public getInfo: (channels: Channel[]) => Promise<void>;
  public doImport: (
    channels: string[],
    emitEvent: boolean,
  ) => Promise<Channel[]>;
}

export class BaseStreamService implements AbstractStreamService {
  public name = ServiceNamesEnum.CUSTOM;
  public protocols = [];
  public hosts = [];
  public paths = [];
  public embedLink = (channel: Channel) => {
    return channel.link;
  };
  public chatLink = (channel: Channel) => {
    return this.embedLink(channel);
  };
  public icon = null;
  public play = (channel: Channel) => {
    return {
      playLink: channel._customPlayUrl || channel.link,
      params: [],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params,
    };
  };
  public checkLiveTimeout = 0;
  public checkLiveConfirmation = 0;
  public getStats = (channels: Channel[], printBalloon: boolean) => null;
  public getInfo = (channels: Channel[]) => null;
  public doImport = async (channels: string[], emitEvent: boolean) => {
    return await [];
  };
}
