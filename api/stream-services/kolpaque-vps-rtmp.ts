import * as path from 'path';
import * as fs from 'fs';

import { Channel } from '../channel-class';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { klpqStreamClient } from '../api-clients';

async function getStatsBase(
  channel: Channel,
  printBalloon: boolean,
): Promise<void> {
  const channelData = await klpqStreamClient.getChannel(
    channel.name,
    channel.host(),
  );

  if (!channelData) {
    return;
  }

  if (channelData.isLive) {
    channel.setOnline(printBalloon);
  } else {
    channel.setOffline();
  }
}

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map((channel) => {
      return getStatsBase(channel, printBalloon);
    }),
  );
}

export class KolpaqueVpsRtmpStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_RTMP;
  public protocols = [ProtocolsEnum.RTMP];
  public hosts = [
    'mediaserver.klpq.men',
    'stream.klpq.men',
    'vps.klpq.men',
    'klpq.men',
    'www.klpq.men',
  ];
  public paths = [/^\/live\/(\S+)\/+/gi, /^\/live\/(\S+)\/*/gi];
  public embedLink = (channel: Channel): string => {
    return `http://klpq.men/stream/${channel.name}`;
  };
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'klpq_vps.png')),
    {
      encoding: null,
    },
  );
  public play = (channel: Channel) => {
    return {
      playLink: `rtmp://mediaserver.klpq.men/live/${channel.name}`,
      params: [],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink: playLink.replace('/live/', '/encode/'),
      params,
    };
  };
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
  public getStats = getStats;
}
