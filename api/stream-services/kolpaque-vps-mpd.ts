import { ProtocolsEnum, ServiceNamesEnum } from './_base';
import { KolpaqueVpsRtmpStreamService } from './kolpaque-vps-rtmp';
import { Channel } from '../channel-class';

export class KolpaqueVpsMpdStreamService extends KolpaqueVpsRtmpStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_MPD;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['klpq.io', 'www.klpq.io', 'klpq.men', 'www.klpq.men'];
  public paths = [
    /^\/stream\/live\/(\S+)\/mpd\/$/gi,
    /^\/stream\/live\/(\S+)\/mpd$/gi,
  ];
  public play(channel: Channel) {
    return {
      playLink: `https://encode.klpq.men/mpd/live_${channel.name}/index.mpd`,
      params: [],
    };
  }
  public playLQ(channel: Channel) {
    const { playLink, params } = this.play(channel);

    return {
      playLink: playLink.replace('/live_', '/encode_'),
      params,
    };
  }
  public doImport = async () => {
    return await [];
  };
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/stream/live/${channelName}/mpd`;
  }
}
