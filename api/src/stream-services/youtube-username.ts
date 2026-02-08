import * as _ from 'lodash';

import { ProtocolsEnum, ServiceNamesEnum } from './_base';
import { YoutubeUserStreamService } from './youtube-user';

export class YoutubeUsernameStreamService extends YoutubeUserStreamService {
  public name = ServiceNamesEnum.YOUTUBE_USERNAME;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.youtube.com', 'youtube.com'];
  public paths = [/^\/@(\S+)\/+/gi, /^\/@(\S+)\/*/gi];
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/@${channelName}`;
  }
}
