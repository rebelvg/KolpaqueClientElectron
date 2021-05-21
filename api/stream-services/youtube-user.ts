import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { youtubeClient } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

export async function getStatsBase(channelId: string): Promise<boolean> {
  const data = await youtubeClient.getStreams(channelId);

  if (!data) {
    return false;
  }

  if (!data.items) {
    return false;
  }

  if (data.items.length === 0) {
    return false;
  }

  return true;
}

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      const data = await youtubeClient.getChannels(channel.name);

      if (!data) {
        return;
      }

      if (!data.items) {
        return;
      }

      const channelStatuses = await Promise.all(
        data.items.map(({ id }) => {
          return getStatsBase(id);
        }),
      );

      if (_.some(channelStatuses)) {
        channel.setOnline(printBalloon);
      } else {
        channel.setOffline();
      }
    }),
  );
}

export class YoutubeUserStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.YOUTUBE_USER;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = [/^\/user\/(\S+)\/+/gi, /^\/user\/(\S+)\/*/gi];
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
  public checkLiveTimeout = 120;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/user/${channelName}`;
  }
}
