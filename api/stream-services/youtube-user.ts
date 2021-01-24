import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { youtubeClient } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

export async function getYoutubeStatsBase(channelId: string): Promise<boolean> {
  const data = await youtubeClient.getStreams(channelId);

  if (!data) {
    return;
  }

  if (data.items.length === 0) {
    return false;
  }

  return true;
}

async function getYoutubeStatsUser(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      const data = await youtubeClient.getChannels(channel.name);

      if (!data) {
        return;
      }

      const channelStatuses = await Promise.all(
        data.items.map(({ id }) => {
          return getYoutubeStatsBase(id);
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
  public checkChannels = getYoutubeStatsUser;
  public getInfo = () => null;
}
