import { Channel } from '../channel-class';
import { config } from '../settings-file';

export enum ServiceNamesEnum {
  KLPQ_VPS_RTMP = 'klpq-vps-rtmp',
  KLPQ_VPS_HTTP = 'klpq-vps-http',
  KLPQ_VPS_MPD = 'klpq-vps-mpd',
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
  public abstract name: ServiceNamesEnum;
  public abstract protocols: ProtocolsEnum[];
  public abstract hosts: string[];
  public abstract paths: RegExp[];
  public abstract embedLink(channel: Channel): string;
  public abstract chatLink(channel: Channel): string;
  public abstract icon: Buffer;
  public abstract play(
    channel: Channel,
  ): { playLink: string; params: string[] };
  public abstract playLQ(
    channel: Channel,
  ): { playLink: string; params: string[] };
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
  public protocols = [];
  public hosts = [];
  public paths = [];
  public embedLink(channel: Channel) {
    return channel.link;
  }
  public chatLink(channel: Channel) {
    return this.embedLink(channel);
  }
  public icon = null;
  public play(channel: Channel) {
    return {
      playLink: channel._customPlayUrl || channel.link,
      params: [],
    };
  }
  public playLQ(channel: Channel) {
    const { playLink, params } = this.play(channel);

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
  ): Promise<void> {
    return await null;
  }
  public async getInfo(channels: Channel[]): Promise<void> {
    return await null;
  }
  public async doImport(channels: string[], emitEvent: boolean) {
    return await [];
  }
  public doImportSettings(emitEvent: boolean) {
    const channelNames = config.settings.twitchImport;

    return this.doImport(channelNames, true);
  }
  public buildChannelLink(channelName: string): string {
    throw 'not_implemented';
  }
}
