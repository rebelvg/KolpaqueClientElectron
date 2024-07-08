import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { KolpaqueVpsRtmpStreamService } from './kolpaque-vps-rtmp';
import { Channel } from '../channel-class';
import { klpqStreamClient } from '../api-clients';
import { config } from '../settings-file';
import { addLogs } from '../logs';
import { SourcesEnum } from '../enums';
import * as _ from 'lodash';

async function doImport(
  this: BaseStreamService,
  channelNames: string[],
  emitEvent: boolean,
): Promise<Channel[]> {
  if (!config.settings.enableKolpaqueImport) {
    return [];
  }

  const res = await klpqStreamClient.getChannelsList();

  if (!res) {
    return [];
  }

  const { channels } = res;

  const channelsAdded: Channel[] = [];

  for (const channelName of channels) {
    const foundChannel = config.findByQuery({
      serviceName: ServiceNamesEnum.KLPQ_VPS_HTTP,
      name: channelName,
    });

    if (foundChannel) {
      if (!foundChannel.sources.includes(SourcesEnum.AUTO_IMPORT)) {
        foundChannel.sources.push(SourcesEnum.AUTO_IMPORT);
      }
    } else {
      const channel = await config.addChannelLink(
        `${this.buildChannelLink(channelName)}`,
        SourcesEnum.AUTO_IMPORT,
      );

      if (channel) {
        channelsAdded.push(channel);

        addLogs('info', 'kolpaque_vps_http_imported_channel', channel.link);
      }
    }
  }

  const channelIdsToDelete: string[] = [];

  for (const channel of config.channels) {
    if (
      channel.serviceName === ServiceNamesEnum.KLPQ_VPS_HTTP &&
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

  if (emitEvent) {
    await config.runChannelUpdates(channelsAdded, emitEvent);
  }

  return channelsAdded;
}

export class KolpaqueVpsHttpStreamService extends KolpaqueVpsRtmpStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_HTTP;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['klpq.io', 'www.klpq.io', 'klpq.men', 'www.klpq.men'];
  public paths = [
    /^\/stream\/live\/(\S+)\/$/gi,
    /^\/stream\/live\/(\S+)$/gi,
    /^\/stream\/(\S+)\/$/gi,
    /^\/stream\/(\S+)$/gi,
  ];
  public doImport = doImport;
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/stream/${channelName}`;
  }
}

export class KolpaqueVpsHttpStreamServiceNew extends KolpaqueVpsHttpStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_HTTP_NEW;
  public hosts = ['stream.klpq.io'];
  public paths = [
    /^\/live\/(\S+)\/$/gi,
    /^\/live\/(\S+)$/gi,
    /^\/(\S+)\/$/gi,
    /^\/(\S+)$/gi,
  ];
  public doImport = async (): Promise<Channel[]> => {
    return await [];
  };
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }
}
