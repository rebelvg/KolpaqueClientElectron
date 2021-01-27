import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { KolpaqueVpsRtmpStreamService } from './kolpaque-vps-rtmp';
import { Channel } from '../channel-class';
import { klpqStreamClient } from '../api-clients';
import { config } from '../settings-file';

async function doImport(
  this: BaseStreamService,
  channelNames: string[],
  emitEvent: boolean,
): Promise<Channel[]> {
  const res = await klpqStreamClient.getChannelsList();

  if (!res) {
    return;
  }

  const { channels } = res;

  const channelsAdded: Channel[] = [];

  for (const channelName of channels) {
    const channel = await config.addChannelLink(
      `${this.buildChannelLink(channelName)}`,
      false,
    );

    if (channel) {
      channelsAdded.push(channel);
    }
  }

  if (emitEvent) {
    await config.addChannels(channelsAdded);
  }

  return channelsAdded;
}

export class KolpaqueVpsHttpStreamService extends KolpaqueVpsRtmpStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_HTTP;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['klpq.men', 'www.klpq.men'];
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
