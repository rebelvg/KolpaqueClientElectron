import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { TWITCH_CHUNK_LIMIT } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { config } from '../settings-file';
import { kickClient } from '../clients/kick';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  const chunkedChannels = _.chunk(channels, TWITCH_CHUNK_LIMIT);

  const channelDataSlugMap: {
    [key: string]: boolean;
  } = {};

  await Promise.all(
    chunkedChannels.map(async (channels) => {
      const channelsData = await kickClient.getChannels(
        channels.map((channel) => channel.name),
      );

      for (const channelData of channelsData) {
        channelDataSlugMap[channelData.name] = channelData.isLive;
      }
    }),
  );

  for (const channel of channels) {
    const channelData = channelDataSlugMap[channel.name];

    if (!channelData) {
      channel.setOffline();

      continue;
    }

    channel.setOnline(printBalloon);
  }
}

class KickStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.KICK;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.kick.com', 'kick.com'];
  public paths = [/^\/(\S+)\/+/gi, /^\/(\S+)\/*/gi];
  public chatLink(channel: Channel): string {
    return `${this.embedLink(channel)}/chat`;
  }
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'kick.ico')),
    {
      encoding: null,
    },
  );
  public play(
    channel: Channel,
  ): Promise<{
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
  public doImportSettings(emitEvent: boolean) {
    const channelNames = config.settings.twitchImport;

    return this.doImport(channelNames, emitEvent);
  }
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }
}

export const kickStreamService = new KickStreamService();
