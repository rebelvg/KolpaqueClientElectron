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
    new URL(channel.link).hostname,
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
  public protocols = [ProtocolsEnum.RTMPS, ProtocolsEnum.RTMP];
  public hosts = [
    'mediaserver.klpq.io:1936',
    'mediaserver.klpq.io',
    'mediaserver.klpq.men',
    'www.klpq.io',
    'www.klpq.men',
    'klpq.io',
    'klpq.men',
    'stream.klpq.men',
    'vps.klpq.men',
  ];
  public paths = [/^\/live\/(\S+)\/$/gi, /^\/live\/(\S+)$/gi];
  public embedLink(channel: Channel): string {
    return `https://stream.klpq.io/${channel.name}`;
  }
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'klpq_vps.png')),
    {
      encoding: null,
    },
  );
  public play(
    channel: Channel,
  ): Promise<{ playLink: string | null; params: string[] }> {
    return Promise.resolve({
      playLink: `${this.protocols[0]}//${this.hosts[0]}/live/${channel.name}`,
      params: [],
    });
  }
  public async playLQ(
    channel: Channel,
  ): Promise<{ playLink: string | null; params: string[] }> {
    const { playLink, params } = await this.play(channel);

    return {
      playLink: playLink?.replace('/live/', '/encode/') || null,
      params,
    };
  }
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
  public getStats = getStats;
  public doImport = async (
    channelNames: string[],
    emitEvent: boolean,
  ): Promise<Channel[]> => {
    return await [];
  };
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/live/${channelName}`;
  }
}
