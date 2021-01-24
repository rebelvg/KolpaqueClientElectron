import * as path from 'path';
import * as fs from 'fs';

import { Channel } from '../channel-class';
import { getStatsBase } from './youtube-user';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      const channelStatus = await getStatsBase(channel.name);

      if (channelStatus) {
        channel.setOnline(printBalloon);
      } else {
        channel.setOffline();
      }
    }),
  );
}

export class YoutubeChannelStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.YOUTUBE_CHANNEL;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = [/^\/channel\/(\S+)\/+/gi, /^\/channel\/(\S+)\/*/gi];
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'youtube.png')),
    {
      encoding: null,
    },
  );
  public playLQ(channel: Channel) {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  }
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
  public getStats = getStats;
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/channel/${channelName}`;
  }
}
