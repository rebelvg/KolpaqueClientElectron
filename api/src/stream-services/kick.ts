import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { kickClient } from '../clients/kick';
import { sleep } from '../helpers';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  const streamStatusMap: {
    [key: string]: boolean;
  } = {};

  for (const channel of channels) {
    const channelData = await kickClient.getChannel(channel.name);

    if (!channelData) {
      return;
    }

    streamStatusMap[channel.name] = channelData.livestream?.is_live || false;

    await sleep(1000);
  }

  for (const channel of channels) {
    const streamStatus = streamStatusMap[channel.name];

    if (typeof streamStatus === 'undefined') {
      continue;
    }

    if (!streamStatus) {
      channel.setOffline();
    } else {
      channel.setOnline(printBalloon);
    }
  }
}

export class KickStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.KICK;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.kick.com', 'kick.com'];
  public paths = [/^\/(\S+)\/+/gi, /^\/(\S+)\/*/gi];
  public chatLink(channel: Channel): string {
    return `${this.embedLink(channel)}/chat`;
  }
  public icon = fs.readFileSync(
    path.normalize(path.join(process.cwd(), './api/icons', 'kick.png')),
    {
      encoding: null,
    },
  );
  public play(channel: Channel): Promise<{
    playLink: string;
    params: string[];
  }> {
    return Promise.resolve({
      playLink: channel._customPlayUrl || channel.link,
      params: [],
    });
  }
  public async playLQ(channel: Channel) {
    const { playLink, params } = await this.play(channel);

    return {
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  }
  public checkLiveTimeout = 30;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }
}
