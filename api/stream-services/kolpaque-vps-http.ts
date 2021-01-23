import * as path from 'path';
import * as fs from 'fs';

import { Channel } from '../channel-class';
import { klpqStreamClient } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getKlpqStatsBase(
  channelObj: Channel,
  printBalloon: boolean,
): Promise<void> {
  const channelData = await klpqStreamClient.getChannel(
    channelObj.name,
    channelObj.host(),
  );

  if (!channelData) {
    return;
  }

  if (channelData.isLive) {
    channelObj.setOnline(printBalloon);
  } else {
    channelObj.setOffline();
  }
}

export async function getKlpqVpsStats(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channelObjs.map((channelObj) => {
      return getKlpqStatsBase(channelObj, printBalloon);
    }),
  );
}

export class KolpaqueVpsHttpStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_HTTP;
  public protocols = [ProtocolsEnum.HTTPS];
  public hosts = ['klpq.men'];
  public paths = ['/stream/'];
  public channelNamePath = 2;
  public embedLink = (channel: Channel): string => {
    return `http://klpq.men/stream/${channel.name}`;
  };
  public chatLink = () => null;
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'klpq_vps.png')),
    {
      encoding: null,
    },
  );
  public play = (channel: Channel) => {
    return {
      playLink: `https://encode.klpq.men/mpd/${channel.name}/index.mpd`,
      params: [],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params,
    };
  };
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
  public checkChannels = getKlpqVpsStats;
}
