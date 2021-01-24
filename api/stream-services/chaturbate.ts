import { Channel } from '../channel-class';
import { chaturbateClient } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getChaturbateStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      const data = await chaturbateClient.getChannel(channel.name);

      if (data.room_status === 'public') {
        channel._customPlayUrl = data.url;

        channel.setOnline(printBalloon);
      } else {
        channel._customPlayUrl = null;

        channel.setOffline();
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
  public getInfo = () => null;
}
