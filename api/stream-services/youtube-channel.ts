import * as path from 'path';
import * as fs from 'fs';

import { Channel } from '../channel-class';
import { getYoutubeStatsBase } from './youtube-user';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getYoutubeStatsChannel(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      const channelStatus = await getYoutubeStatsBase(channel.name);

      if (channelStatus) {
        channel.setOnline(printBalloon);
      } else {
        channel.setOffline();
      }
    }),
  );
}

export class YoutubeChannelStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.YOUTUBE_CHANNEL;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = [/^\/channel\/(\S+)\/+/gi, /^\/channel\/(\S+)\/*/gi];
  public embedLink = (channel: Channel) => {
    return channel.link;
  };
  public chatLink = (channel: Channel) => {
    return channel.link;
  };
  public icon = fs.readFileSync(
    path.normalize(path.join(process.cwd(), 'icons', 'youtube.png')),
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
  public checkChannels = getYoutubeStatsChannel;
  public getInfo = () => null;
}
