import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { logger } from '../logs';
import { Innertube, YTNodes, Log } from 'youtubei.js';
import { app } from 'electron';

Log.setLevel(Log.Level.NONE);

const isDev = process.env.NODE_ENV === 'dev';

if (isDev) {
  Log.setLevel(Log.Level.INFO);
}

export async function getStatsBase(channelId: string): Promise<boolean> {
  try {
    const youtube = await Innertube.create({});

    const channel = await youtube.getChannel(channelId);

    const streams = await channel.getLiveStreams();

    if (streams.current_tab?.content?.type !== 'RichGrid') {
      return false;
    }

    let isLive = false;

    _.forEach(
      streams.current_tab.content.as(YTNodes.RichGrid).contents,
      (stream: YTNodes.RichItem) => {
        if (stream.type !== 'RichItem') {
          return;
        }

        if (stream.content?.type !== 'Video') {
          return;
        }

        if (stream.content.as(YTNodes.Video).duration?.text === 'LIVE') {
          isLive = true;
        }
      },
    );

    return isLive;
  } catch (error) {
    logger('debug', error, channelId);

    return false;
  }
}

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  for (const channel of channels) {
    try {
      const youtube = await Innertube.create({});

      const { payload }: { payload?: { browseId?: string } } =
        await youtube.resolveURL(channel.url);

      if (!payload?.browseId) {
        return;
      }

      const channelStatus = await getStatsBase(payload.browseId);

      if (channelStatus) {
        channel.setOnline(printBalloon);
      } else {
        channel.setOffline();
      }
    } catch (error) {
      logger('debug', error, channel.url);
    }
  }
}

export class YoutubeUserStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.YOUTUBE_USER;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = [/^\/user\/(\S+)\/+/gi, /^\/user\/(\S+)\/*/gi];
  public icon = fs.readFileSync(
    path.normalize(path.join(app.getAppPath(), './api/icons', 'youtube.png')),
    {
      encoding: null,
    },
  );
  public async playLQ(channel: Channel) {
    const { playUrl, params } = await this.play(channel);

    return {
      playUrl,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  }
  public checkLiveTimeout = 300;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public buildUrl(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/user/${channelName}`;
  }
  public embedUrl(channel: Channel): string {
    const url = super.embedUrl(channel);

    return `${url}/streams`;
  }
}
