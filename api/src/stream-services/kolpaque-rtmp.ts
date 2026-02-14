import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { kolpaqueStreamClient } from '../api-clients';
import { config } from '../settings-file';
import { SourcesEnum } from '../enums';
import { logger } from '../logs';
import { app } from 'electron';
import { serviceManager } from '../services';

async function getStatsBase(
  channel: Channel,
  printBalloon: boolean,
): Promise<void> {
  const channelData = await kolpaqueStreamClient.getChannel(channel.name);

  if (!channelData) {
    return;
  }

  if (channelData.streams.length > 0) {
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

async function _doImport(this: BaseStreamService): Promise<Channel[]> {
  if (!config.settings.enableKolpaqueImport) {
    return [];
  }

  const res: { channels: string[] } = { channels: [] };

  if (!res) {
    return [];
  }

  const { channels } = res;

  const channelsAdded: Channel[] = [];

  const service = _.find(serviceManager.services, {
    name: ServiceNamesEnum.KOLPAQUE_RTMP,
  });

  if (!service) {
    return [];
  }

  for (const channelName of channels) {
    const foundChannel = service.channels.find((c) => c.name === channelName);

    if (foundChannel) {
      if (!foundChannel.sources.includes(SourcesEnum.AUTO_IMPORT)) {
        foundChannel.sources.push(SourcesEnum.AUTO_IMPORT);
      }
    } else {
      const channel = await config.addChannelByUrl(
        `${this.buildUrl(channelName)}`,
        SourcesEnum.AUTO_IMPORT,
      );

      if (channel) {
        channelsAdded.push(channel);
      }
    }
  }

  const channelIdsToDelete: string[] = [];

  for (const channel of service.channels) {
    if (
      channel.sources.includes(SourcesEnum.AUTO_IMPORT) &&
      !channels.includes(channel.name)
    ) {
      _.pull(channel.sources, SourcesEnum.AUTO_IMPORT);

      if (channel.sources.length === 0) {
        channelIdsToDelete.push(channel.id);
      }
    }
  }

  for (const channelId of channelIdsToDelete) {
    config.removeChannelById(channelId);
  }

  await config.runChannelUpdates(service, channelsAdded, 'doImport');

  return channelsAdded;
}

export class KolpaqueRtmpStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.KOLPAQUE_RTMP;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['stream.klpq.io'];
  public paths = [/^\/(\S+)\/.*/gi, /^\/(\S+)$/gi];
  public embedUrl(channel: Channel): string {
    return `https://stream.klpq.io/${channel.name}`;
  }
  public icon = fs.readFileSync(
    path.normalize(path.join(app.getAppPath(), './api/icons', 'klpq_vps.png')),
    {
      encoding: null,
    },
  );

  public async play(
    channel: Channel,
  ): Promise<{ playUrl: string | null; params: string[] }> {
    const channelData = await kolpaqueStreamClient.getChannel(channel.name);

    if (!channelData) {
      return {
        playUrl: null,
        params: [],
      };
    }

    const stream = channelData.streams.find(
      (s) => s.protocol === 'rtmp' && s.name === channel.name,
    );

    if (!stream) {
      return {
        playUrl: null,
        params: [],
      };
    }

    return Promise.resolve({
      playUrl: stream.urls.edge,
      params: [],
    });
  }

  public async playLQ(
    channel: Channel,
  ): Promise<{ playUrl: string | null; params: string[] }> {
    const channelData = await kolpaqueStreamClient.getChannel(channel.name);

    if (!channelData) {
      return {
        playUrl: null,
        params: [],
      };
    }

    const streams = channelData.streams.filter(
      (s) => s.protocol === 'rtmp' && s.name === channel.name,
    );

    const stream = _.last(streams);

    if (!stream) {
      return {
        playUrl: null,
        params: [],
      };
    }

    return Promise.resolve({
      playUrl: stream.urls.edge,
      params: [],
    });
  }
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
  public getStats = getStats;
  public buildUrl(channelName: string) {
    return `https://stream.klpq.io/${channelName}`;
  }
}
