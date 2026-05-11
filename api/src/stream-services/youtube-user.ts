import * as path from 'path';
import * as fs from 'fs';

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

export async function getStatsBase(
  channelId: string,
): Promise<boolean | undefined> {
  const youtube = await Innertube.create({});

  try {
    const channel = await youtube.getChannel(channelId);

    const streams = await channel.getLiveStreams();

    return JSON.stringify(streams).includes(
      `THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE`,
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes(`Tab "streams" not found`)) {
        return false;
      }
    }

    logger('error', error);
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

      switch (channelStatus) {
        case true:
          channel.setOnline(printBalloon);

          break;
        case false:
          channel.setOffline();

          break;
        default:
          break;
      }
    } catch (error) {
      logger('error', error, channel.url);
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
