import axios from 'axios';
import { addLogs } from './Logs';
import { twitchApiKey } from './Globals';

interface ITwitchClientUsers {
  data: Array<{
    id: string;
    login: string;
  }>;
}

interface ITwitchClientStreams {
  data: Array<{
    user_id: string;
  }>;
}

class TwitchClient {
  private baseUrl = 'https://api.twitch.tv/helix';
  private apiKey = twitchApiKey;

  public async getUsers(channelNames: string[]): Promise<ITwitchClientUsers> {
    if (channelNames.length === 0) {
      return;
    }

    try {
      const { data: userData } = await axios.get(
        `${this.baseUrl}/users?${channelNames.map(channelName => `login=${channelName}`).join('&')}`,
        {
          headers: { 'Client-ID': this.apiKey }
        }
      );

      return userData;
    } catch (error) {
      addLogs(error);

      return;
    }
  }

  public async getStreams(userIds: string[]): Promise<ITwitchClientStreams> {
    if (userIds.length === 0) {
      return;
    }

    try {
      const { data: streamData } = await axios.get(
        `${this.baseUrl}/streams/?${userIds.map(userId => `user_id=${userId}`).join('&')}`,
        { headers: { 'Client-ID': this.apiKey } }
      );

      return streamData;
    } catch (error) {
      addLogs(error);

      return;
    }
  }
}

interface IKlpqStreamChannel {
  isLive: boolean;
}

class KlpqStreamClient {
  private baseUrl: 'https://stats.klpq.men/api';

  public async getChannel(channelName: string): Promise<IKlpqStreamChannel> {
    const url = `${this.baseUrl}/channels/nms/live/${channelName}`;

    try {
      const { data } = await axios.get(url);

      return data;
    } catch (error) {
      addLogs(error);

      return;
    }
  }
}

export const twitchClient = new TwitchClient();
export const klpqStreamClient = new KlpqStreamClient();
