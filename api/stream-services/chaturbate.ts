import { Channel } from '../channel-class';
import { chaturbateClient } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getChaturbateStats(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channelObjs.map(async (channelObj) => {
      const data = await chaturbateClient.getChannel(channelObj.name);

      if (data.room_status === 'public') {
        channelObj._customPlayUrl = data.url;

        channelObj.setOnline(printBalloon);
      } else {
        channelObj._customPlayUrl = null;

        channelObj.setOffline();
      }
    }),
  );
}

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
  public checkChannels = getChaturbateStats;
}
