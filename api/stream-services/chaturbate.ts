import { BaseStreamService } from './twitch';
import { ProtocolsEnum, ServiceNamesEnum } from '../globals';
import { Channel } from '../channel-class';

export class ChaturbateStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.CHATURBATE;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.chaturbate.com', 'chaturbate.com'];
  public paths = ['/'];
  public channelNamePath = 1;
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
  public checkLiveTimeout = 120;
  public checkLiveConfirmation = 3;
}
