import * as path from 'path';
import * as fs from 'fs';

import { BaseStreamService } from './twitch';
import { ProtocolsEnum, ServiceNamesEnum } from '../globals';
import { Channel } from '../channel-class';

export class KolpaqueVpsHttpStreamService implements BaseStreamService {
  public serviceName = ServiceNamesEnum.KLPQ_VPS_HTTP;
  public protocols = [ProtocolsEnum.HTTPS];
  public hosts = ['klpq.men'];
  public paths = ['/stream/'];
  public name = 2;
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
}
