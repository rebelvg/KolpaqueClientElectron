import { ProtocolsEnum, ServiceNamesEnum } from './_base';
import { KolpaqueVpsRtmpStreamService } from './kolpaque-vps-rtmp';
import { Channel } from '../channel-class';
import { klpqEncodeClient } from '../api-clients';

export class KolpaqueVpsMpdStreamService extends KolpaqueVpsRtmpStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_MPD;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['klpq.io', 'www.klpq.io', 'klpq.men', 'www.klpq.men'];
  public paths = [
    /^\/stream\/live_mpd\/(\S+)\/$/gi,
    /^\/stream\/live_mpd\/(\S+)$/gi,
  ];
  public async play(channel: Channel) {
    const res = await klpqEncodeClient.getStreamId(channel.name);

    if (!res) {
      return {
        playLink: null,
        params: [],
      };
    }

    return {
      playLink: `https://encode.klpq.io/watch/${res.id}/index.mpd`,
      params: [],
    };
  }
  public async playLQ(channel: Channel) {
    const { playLink, params } = await this.play(channel);

    return {
      playLink: playLink?.replace('/live_', '/encode_') || null,
      params,
    };
  }
  public doImport = async () => {
    return await [];
  };
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/stream/live_mpd/${channelName}`;
  }
}
