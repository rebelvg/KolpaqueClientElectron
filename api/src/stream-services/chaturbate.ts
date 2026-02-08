import { Channel } from '../channel-class';
import { chaturbateClient } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      const data = await chaturbateClient.getChannel(channel.name);

      if (!data) {
        return;
      }

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

export class ChaturbateStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.CHATURBATE;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.chaturbate.com', 'chaturbate.com'];
  public paths = [/^\/(\S+)\/+/gi, /^\/(\S+)\/*/gi];
  public checkLiveTimeout = 120;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }
}
