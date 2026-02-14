import * as _ from 'lodash';
import { Channel } from '../channel-class';
import { config } from '../settings-file';
import { nativeImage } from 'electron';

export enum ServiceNamesEnum {
  KOLPAQUE_RTMP = 'kolpaque-rtmp',
  TWITCH = 'twitch',
  YOUTUBE_USER = 'youtube-user',
  YOUTUBE_CHANNEL = 'youtube-channel',
  YOUTUBE_USERNAME = 'youtube-username',
  CHATURBATE = 'chaturbate',
  KICK = 'kick',
  CUSTOM = 'custom',
}

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  RTMPS = 'rtmps:',
  HTTP = 'http:',
  HTTPS = 'https:',
}

abstract class AbstractStreamService {
  public abstract name: ServiceNamesEnum;
  public abstract protocols: ProtocolsEnum[];
  public abstract hosts: string[];
  public abstract paths: RegExp[];
  public abstract embedUrl(channel: Channel): string;
  public abstract chatUrl(channel: Channel): string;
  public abstract icon: Buffer | null;
  public abstract play(
    channel: Channel,
  ): Promise<{ playUrl: string | null; params: string[] }>;
  public abstract playLQ(
    channel: Channel,
  ): Promise<{ playUrl: string | null; params: string[] }>;
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
  public abstract buildUrl(channelName: string): string;
}

export class BaseStreamService implements AbstractStreamService {
  public name = ServiceNamesEnum.CUSTOM;
  public protocols: ProtocolsEnum[] = [];
  public hosts: string[] = [];
  public paths: RegExp[] = [];
  public embedUrl(channel: Channel) {
    return channel.url;
  }
  public chatUrl(channel: Channel) {
    return this.embedUrl(channel);
  }
  public icon: Buffer | null = null;
  public play(
    channel: Channel,
  ): Promise<{ playUrl: string | null; params: string[] }> {
    return Promise.resolve({
      playUrl: channel._customPlayUrl || channel.url,
      params: [],
    });
  }
  public async playLQ(
    channel: Channel,
  ): Promise<{ playUrl: string | null; params: string[] }> {
    const { playUrl, params } = await this.play(channel);

    return {
      playUrl,
      params,
    };
  }
  public checkLiveTimeout = 0;
  public checkLiveConfirmation = 0;
  public getStats(channels: Channel[], printBalloon: boolean): Promise<void> {
    return Promise.resolve();
  }
  public getInfo(channels: Channel[]): Promise<void> {
    return Promise.resolve();
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
  public buildUrl(channelName: string): string {
    throw 'not_implemented';
  }
  get channels() {
    return _.filter(
      config.channels,
      ({ serviceName }) => serviceName === this.name,
    );
  }
  get _trayIcon() {
    return this.icon
      ? nativeImage.createFromBuffer(this.icon).resize({ height: 16 })
      : null;
  }
}
