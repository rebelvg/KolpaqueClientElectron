import { BaseStreamService } from './twitch';
import { ServiceNamesEnum } from '../globals';
import { Channel } from '../channel-class';

export class CustomStreamService implements BaseStreamService {
  public serviceName = ServiceNamesEnum.CUSTOM;
  public protocols = [];
  public hosts = [];
  public paths = [];
  public name = 0;
  public embedLink = () => null;
  public chatLink = () => null;
  public icon = null;
  public play = (channel: Channel) => {
    return {
      playLink: channel._customPlayUrl || channel.link,
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