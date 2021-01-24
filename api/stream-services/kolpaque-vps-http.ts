import { ProtocolsEnum, ServiceNamesEnum } from './_base';
import { KolpaqueVpsRtmpStreamService } from './kolpaque-vps-rtmp';

export class KolpaqueVpsHttpStreamService extends KolpaqueVpsRtmpStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_HTTP;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['klpq.men', 'www.klpq.men'];
  public paths = [/^\/stream\/(\S+)\/+/gi, /^\/stream\/(\S+)\/*/gi];

  // public play = (channel: Channel) => {
  //   return {
  //     playLink: `https://encode.klpq.men/mpd/live_${channel.name}/index.mpd`,
  //     params: [],
  //   };
  // };
  // public playLQ = (channel: Channel) => {
  //   const { playLink, params } = this.play(channel);

  //   return {
  //     playLink,
  //     params,
  //   };
  // };
}
