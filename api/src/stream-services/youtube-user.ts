import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { addLogs } from '../logs';
import { Innertube } from 'youtubei.js';

interface IYoutubeLiveStreams {
  current_tab?: {
    content?: {
      type: 'RichGrid';
      contents?: {
        type: 'RichItem';
        content?: {
          type: 'Video';
          id: string;
          duration?: {
            text: 'LIVE';
          };
        };
      }[];
    };
  };
}

const youtubePromise = Innertube.create({});

export async function getStatsBase(channelId: string): Promise<boolean> {
  try {
    const youtube = await youtubePromise;

    const channel = await youtube.getChannel(channelId);

    await channel.getLiveStreams();

    const streams = (await channel.getLiveStreams()) as IYoutubeLiveStreams;

    if (streams.current_tab?.content?.type !== 'RichGrid') {
      return false;
    }

    let isLive = false;

    _.forEach(streams?.current_tab?.content?.contents, (stream) => {
      if (stream?.type !== 'RichItem') {
        return;
      }

      if (stream.content?.type !== 'Video') {
        return;
      }

      if (stream.content.duration?.text === 'LIVE') {
        isLive = true;
      }
    });

    return isLive;
  } catch (error) {
    addLogs('warn', error);

    return false;
  }
}

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  for (const channel of channels) {
    try {
      const youtube = await youtubePromise;

      const youtubeNavigation = (await youtube.resolveURL(channel.link)) as {
        payload?: {
          browseId?: string;
        };
      };

      if (!youtubeNavigation.payload?.browseId) {
        return;
      }

      const channelStatus = await getStatsBase(
        youtubeNavigation.payload.browseId,
      );

      addLogs('info', channel.name, channelStatus);

      if (channelStatus) {
        channel.setOnline(printBalloon);
      } else {
        channel.setOffline();
      }
    } catch (error) {
      addLogs('warn', error);
    }
  }
}

export class YoutubeUserStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.YOUTUBE_USER;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = [/^\/user\/(\S+)\/+/gi, /^\/user\/(\S+)\/*/gi];
  public icon = fs.readFileSync(
    path.normalize(path.join(process.cwd(), './api/icons', 'youtube.png')),
    {
      encoding: null,
    },
  );
  public async playLQ(channel: Channel) {
    const { playLink, params } = await this.play(channel);

    return {
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  }
  public checkLiveTimeout = 300;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/user/${channelName}`;
  }
  public embedLink(channel: Channel): string {
    const link = super.embedLink(channel);

    return `${link}/streams`;
  }
}
