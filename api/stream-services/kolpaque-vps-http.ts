import { ProtocolsEnum, ServiceNamesEnum } from './_base';
import { KolpaqueVpsRtmpStreamService } from './kolpaque-vps-rtmp';

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
  public doImport = async () => {
    return await [];
  };
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/stream/${channelName}`;
  }
}
