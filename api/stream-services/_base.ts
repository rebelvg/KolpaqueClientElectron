import { Channel } from '../channel-class';

export enum ServiceNamesEnum {
  KLPQ_VPS_RTMP = 'klpq-vps-rtmp',
  KLPQ_VPS_HTTP = 'klpq-vps-http',
  KLPQ_VPS_MPD = 'klpq-vps-mpd',
  KLPQ_VPS_HTTP_NEW = 'klpq-vps-http-new',
  KLPQ_VPS_MPD_NEW = 'klpq-vps-mpd-new',
  TWITCH = 'twitch',
  YOUTUBE_USER = 'youtube-user',
  YOUTUBE_CHANNEL = 'youtube-channel',
  YOUTUBE_USERNAME = 'youtube-username',
  CHATURBATE = 'chaturbate',
  CUSTOM = 'custom',
}

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  HTTP = 'http:',
  HTTPS = 'https:',
}

abstract class AbstractStreamService {
  public abstract name: ServiceNamesEnum;
  public abstract protocols: ProtocolsEnum[];
  public abstract hosts: string[];
  public abstract paths: RegExp[];
  public abstract embedLink(channel: Channel): string;
  public abstract chatLink(channel: Channel): string;
  public abstract icon: Buffer | null;
  public abstract play(
    channel: Channel,
  ): Promise<{ playLink: string | null; params: string[] }>;
  public abstract playLQ(
    channel: Channel,
  ): Promise<{ playLink: string | null; params: string[] }>;
  public abstract checkLiveTimeout: number;
  public abstract checkLiveConfirmation: number;
  public abstract getStats(
    channels: Channel[],
    printBalloon: boolean,
  ): Promise<void>;
  public abstract getInfo(channels: Channel[]): Promise<void>;
  public abstract doImport(
    channels: string[],
    emitEvent: boolean,
  ): Promise<Channel[]>;
  public abstract doImportSettings(emitEvent: boolean): Promise<Channel[]>;
  public abstract buildChannelLink(channelName: string): string;
}

export class BaseStreamService implements AbstractStreamService {
  public name = ServiceNamesEnum.CUSTOM;
  public protocols: ProtocolsEnum[] = [];
  public hosts: string[] = [];
  public paths: RegExp[] = [];
  public embedLink(channel: Channel) {
    return channel.link;
  }
  public chatLink(channel: Channel) {
    return this.embedLink(channel);
  }
  public icon: Buffer | null = null;
  public play(
    channel: Channel,
  ): Promise<{ playLink: string | null; params: string[] }> {
    return Promise.resolve({
      playLink: channel._customPlayUrl || channel.link,
      params: [],
    });
  }
  public async playLQ(
    channel: Channel,
  ): Promise<{ playLink: string | null; params: string[] }> {
    const { playLink, params } = await this.play(channel);

    return {
      playLink,
      params,
    };
  }
  public checkLiveTimeout = 0;
  public checkLiveConfirmation = 0;
  public async getStats(
    channels: Channel[],
    printBalloon: boolean,
  ): Promise<undefined> {
    return await undefined;
  }
  public async getInfo(channels: Channel[]): Promise<undefined> {
    return await undefined;
  }
  public async doImport(
    channels: string[],
    emitEvent: boolean,
  ): Promise<Channel[]> {
    return await [];
  }
  public doImportSettings(emitEvent: boolean): Promise<Channel[]> {
    return this.doImport([], emitEvent);
  }
  public buildChannelLink(channelName: string): string {
    throw 'not_implemented';
  }
}
