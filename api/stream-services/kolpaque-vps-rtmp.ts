import * as path from 'path';
import * as fs from 'fs';

import { Channel } from '../channel-class';
import { getKlpqVpsStats } from './kolpaque-vps-http';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

export class KolpaqueVpsRtmpStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.KLPQ_VPS_RTMP;
  public protocols = [ProtocolsEnum.RTMP];
  public hosts = ['mediaserver.klpq.men', 'stream.klpq.men', 'vps.klpq.men'];
  public paths = ['/live/'];
  public channelNamePath = 2;
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
  public checkLiveTimeout = 5;
  public checkLiveConfirmation = 0;
  public checkChannels = getKlpqVpsStats;
  public getInfo = () => null;
}
