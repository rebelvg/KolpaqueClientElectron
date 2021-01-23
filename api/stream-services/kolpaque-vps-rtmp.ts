import * as path from 'path';
import * as fs from 'fs';

import { BaseStreamService } from './twitch';
import { ProtocolsEnum, ServiceNamesEnum } from '../globals';
import { Channel } from '../channel-class';

export class KolpaqueVpsRtmpStreamService implements BaseStreamService {
  public serviceName = ServiceNamesEnum.KLPQ_VPS_RTMP;
  public protocols = [ProtocolsEnum.RTMP];
  public hosts = ['mediaserver.klpq.men', 'stream.klpq.men', 'vps.klpq.men'];
  public paths = ['/live/'];
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
      playLink: `rtmp://mediaserver.klpq.men/live/${channel.name}`,
      params: [],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink: playLink.replace('/live/', '/encode/'),
      params,
    };
  };
}
