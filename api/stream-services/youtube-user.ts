import * as path from 'path';
import * as fs from 'fs';

import { BaseStreamService } from './twitch';
import { ProtocolsEnum, ServiceNamesEnum } from '../globals';
import { Channel } from '../channel-class';

export class YoutubeUserStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.YOUTUBE_USER;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = ['/user/'];
  public channelNamePath = 2;
  public embedLink = () => null;
  public chatLink = () => null;
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'youtube.png')),
    {
      encoding: null,
    },
  );
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
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  };
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
}
