import * as path from 'path';
import * as fs from 'fs';

import { Channel } from '../channel-class';
import { ProtocolsEnum, ServiceNamesEnum } from '../globals';

export abstract class BaseStreamService {
  public name: ServiceNamesEnum;
  public protocols: ProtocolsEnum[];
  public hosts: string[];
  public paths: string[];
  public channelNamePath: number;
  public embedLink: (channel: Channel) => string;
  public chatLink: (channel: Channel) => string;
  public icon: Buffer;
  public play: (channel: Channel) => { playLink: string; params: string[] };
  public playLQ: (channel: Channel) => { playLink: string; params: string[] };
  public checkLiveTimeout = 0;
  public checkLiveConfirmation = 0;
}

export class TwitchStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.TWITCH;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'];
  public paths = ['/'];
  public channelNamePath = 1;
  public embedLink = () => null;
  public chatLink = (channel: Channel): string => {
    return `https://www.twitch.tv/${channel.name}/chat`;
  };
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'twitch.png')),
    {
      encoding: null,
    },
  );
  public play = (channel: Channel) => {
    return {
      playLink: channel._customPlayUrl || channel.link,
      params: ['--twitch-disable-hosting', '--twitch-disable-ads'],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  };
  public checkLiveTimeout = 30;
  public checkLiveConfirmation = 3;
}
