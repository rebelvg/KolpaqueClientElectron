import axios from 'axios';
import { addLogs } from './Logs';
import { twitchApiKey } from './Globals';
import { config } from './SettingsFile';
import * as qs from 'querystring';

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
  private baseUrl = 'https://stats.klpq.men/api';

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

interface IYoutubeChannels {
  items: Array<{ id: string }>;
}

interface IYoutubeStreams {
  items: any[];
}

class YoutubeClient {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private apiKey = config.settings.youtubeApiKey;

  public async getChannels(channelName: string): Promise<IYoutubeChannels> {
    const channelsUrl = new URL(`${this.baseUrl}/channels`);

    channelsUrl.searchParams.set('forUsername', channelName);
    channelsUrl.searchParams.set('part', 'id');
    channelsUrl.searchParams.set('key', this.apiKey);

    try {
      const { data } = await axios.get(channelsUrl.href);

      return data;
    } catch (error) {
      addLogs(error);

      return;
    }
  }

  public async getStreams(channelId: string): Promise<IYoutubeStreams> {
    const searchUrl = new URL(`${this.baseUrl}/search`);

    searchUrl.searchParams.set('channelId', channelId);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('eventType', 'live');
    searchUrl.searchParams.set('key', this.apiKey);

    try {
      const { data } = await axios.get(searchUrl.href);

      return data;
    } catch (error) {
      addLogs(error);

      return;
    }
  }
}

interface IChaturbateChannel {
  room_status: string;
  url: string;
}

class ChaturbateClient {
  private baseUrl = 'https://chaturbate.com/get_edge_hls_url_ajax';

  public async getChannel(channelName: string): Promise<IChaturbateChannel> {
    const url = `${this.baseUrl}/`;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    };

    try {
      const { data } = await axios.post(
        url,
        qs.stringify({
          room_slug: channelName,
          bandwidth: 'high'
        }),
        {
          headers
        }
      );

      return data;
    } catch (error) {
      addLogs(error);

      return;
    }
  }
}

export const twitchClient = new TwitchClient();
export const klpqStreamClient = new KlpqStreamClient();
export const youtubeClient = new YoutubeClient();
export const chaturbateClient = new ChaturbateClient();
