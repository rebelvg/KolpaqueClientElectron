import { ServiceNamesEnum } from './_base';
import { YoutubeUserStreamService } from './youtube-user';

export class YoutubeCustomStreamService extends YoutubeUserStreamService {
  public name = ServiceNamesEnum.YOUTUBE_CUSTOM;
  public paths = [
    /^\/(?!@|(?:watch|playlist|shorts|live|feed|results|user|channel|c|embed|clip|gaming|premium|account|settings|signin|logout|redirect|about|t|upload)(?:\/|$))([^/\s]+)(?:\/(?:featured|videos|shorts|streams|playlists|community|about|live))?\/*$/i,
  ];
  public buildUrl(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }
}
