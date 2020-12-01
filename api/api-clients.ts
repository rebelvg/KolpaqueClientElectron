import axios, { AxiosError } from 'axios';
import { addLogs } from './logs';
import { klpqServiceUrl, TWITCH_CLIENT_ID } from './globals';
import { config } from './settings-file';
import * as qs from 'querystring';
import { shell, ipcMain } from 'electron';

import { SOCKET_CLIENT_ID, ITwitchUser } from './socket-client';

ipcMain.on('twitch_login', async () => {
  await klpqServiceClient.getTwitchUser();
});

ipcMain.on('youtube_login', async () => {
  await klpqServiceClient.getYoutubeUser();
});

export interface ITwitchClientUsers {
  data: Array<{
    id: string;
    login: string;
    profile_image_url?: string;
  }>;
}

export interface ITwitchClientStreams {
  data: Array<{
    user_id: string;
  }>;
}

export interface ITwitchFollowedChannels {
  data: ITwitchFollowedChannel[];
  pagination: {
    cursor: string;
  };
}

export interface ITwitchFollowedChannel {
  to_id: string;
}

export const TWITCH_CHUNK_LIMIT = 100;

class TwitchClient {
  private baseUrl = 'https://api.twitch.tv/helix';
  private accessToken: string = null;

  private get refreshToken(): string {
    return config.settings.twitchRefreshToken;
  }

  public setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
  }

  public setRefreshToken(refreshToken: string): void {
    config.settings.twitchRefreshToken = refreshToken;
  }

  public async refreshAccessToken(): Promise<boolean> {
    if (this.accessToken) {
      return;
    }

    if (!this.refreshToken) {
      addLogs('no_twitch_refresh_token');

      return false;
    }

    const user = await klpqServiceClient.refreshTwitchToken(this.refreshToken);

    if (!user) {
      addLogs('refresh_twitch_access_token_failed');

      return false;
    }

    this.accessToken = user.accessToken;
    this.setRefreshToken(user.refreshToken);

    addLogs('twitch_new_access_token');

    return true;
  }

  public async getUsersByLogin(
    channelNames: string[],
  ): Promise<ITwitchClientUsers> {
    await this.refreshAccessToken();

    if (!this.accessToken) {
      return;
    }

    if (channelNames.length === 0) {
      return;
    }

    try {
      const { data: userData } = await axios.get<ITwitchClientUsers>(
        `${this.baseUrl}/users?${channelNames
          .map((channelName) => `login=${channelName}`)
          .join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Client-ID': TWITCH_CLIENT_ID,
          },
        },
      );

      return userData;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getUsersById(ids: string[]): Promise<ITwitchClientUsers> {
    await this.refreshAccessToken();

    if (!this.accessToken) {
      return;
    }

    if (ids.length === 0) {
      return;
    }

    try {
      const { data: userData } = await axios.get<ITwitchClientUsers>(
        `${this.baseUrl}/users?${ids.map((id) => `id=${id}`).join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Client-ID': TWITCH_CLIENT_ID,
          },
        },
      );

      return userData;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getStreams(userIds: string[]): Promise<ITwitchClientStreams> {
    await this.refreshAccessToken();

    if (!this.accessToken) {
      return;
    }

    if (userIds.length === 0) {
      return;
    }

    try {
      const { data: streamData } = await axios.get<ITwitchClientStreams>(
        `${this.baseUrl}/streams/?${userIds
          .map((userId) => `user_id=${userId}`)
          .join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Client-ID': TWITCH_CLIENT_ID,
          },
        },
      );

      return streamData;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getFollowedChannels(
    userId: string,
    after: string,
  ): Promise<ITwitchFollowedChannels> {
    await this.refreshAccessToken();

    if (!this.accessToken) {
      return;
    }

    const url = new URL(`${this.baseUrl}/users/follows?from_id=${userId}`);

    url.searchParams.set('first', '100');
    url.searchParams.set('after', after);

    try {
      const { data } = await axios.get<ITwitchFollowedChannels>(url.href, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Client-ID': TWITCH_CLIENT_ID,
        },
      });

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: AxiosError): void {
    addLogs(
      new Error(error.message),
      error?.response?.status,
      error?.response?.data,
    );

    if (error?.response?.status === 401) {
      addLogs('twitch_access_token_fail');

      this.accessToken = null;
    }
  }
}

export interface IKlpqStreamChannel {
  isLive: boolean;
}

class KlpqStreamClient {
  private baseUrl = 'https://stats.klpq.men/api';

  public async getChannel(
    channelName: string,
    host: string,
  ): Promise<IKlpqStreamChannel> {
    const url = `${this.baseUrl}/channels/${host}/live/${channelName}`;

    try {
      const { data } = await axios.get<IKlpqStreamChannel>(url);

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }
}

export interface IYoutubeChannels {
  items: Array<{ id: string }>;
}

export interface IYoutubeStreams {
  items: any[];
}

class YoutubeClient {
  private accessToken: string = null;

  private get refreshToken(): string {
    return config.settings.youtubeRefreshToken;
  }

  public setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
  }

  public setRefreshToken(refreshToken: string): void {
    config.settings.youtubeRefreshToken = refreshToken;
  }

  public async refreshAccessToken(): Promise<boolean> {
    if (this.accessToken) {
      return;
    }

    if (!this.refreshToken) {
      addLogs('no_youtube_refresh_token');

      return false;
    }

    const user = await klpqServiceClient.refreshYoutubeToken(this.refreshToken);

    if (!user) {
      addLogs('refresh_youtube_access_token_failed');

      return false;
    }

    this.accessToken = user.accessToken;
    this.setRefreshToken(user.refreshToken);

    addLogs('youtube_new_access_token');

    return true;
  }

  public getChannels(channelName: string): Promise<IYoutubeChannels> {
    if (!config.settings.youtubeTosConsent) {
      return;
    }

    return klpqServiceClient.getYoutubeChannels(channelName);
  }

  public getStreams(channelId: string): Promise<IYoutubeStreams> {
    if (!config.settings.youtubeTosConsent) {
      return;
    }

    return klpqServiceClient.getYoutubeStreams(channelId);
  }
}

export interface IChaturbateChannel {
  room_status: string;
  url: string;
}

class ChaturbateClient {
  private baseUrl = 'https://chaturbate.com/get_edge_hls_url_ajax';

  public async getChannel(channelName: string): Promise<IChaturbateChannel> {
    const url = `${this.baseUrl}/`;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    };

    try {
      const { data } = await axios.post<IChaturbateChannel>(
        url,
        qs.stringify({
          room_slug: channelName,
          bandwidth: 'high',
        }),
        {
          headers,
        },
      );

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }
}

interface IKlpqUser {
  jwt: string;
}

class KlpqServiceClient {
  private baseUrl = klpqServiceUrl;
  private jwtToken: string = null;

  public setUser(jwt: string): void {
    this.jwtToken = jwt;
  }

  public async getTwitchUser(): Promise<void> {
    await shell.openExternal(
      `${this.baseUrl}/auth/twitch?requestId=${SOCKET_CLIENT_ID}`,
    );
  }

  public async getYoutubeUser(): Promise<void> {
    await shell.openExternal(
      `${this.baseUrl}/auth/google?requestId=${SOCKET_CLIENT_ID}`,
    );
  }

  public async refreshJwtToken(): Promise<boolean> {
    if (this.jwtToken) {
      return;
    }

    const user = await this.refreshKlpqToken();

    if (!user) {
      addLogs('refresh_klpq_access_token_failed');

      return false;
    }

    this.jwtToken = user.jwt;

    return true;
  }

  public async refreshTwitchToken(refreshToken: string): Promise<ITwitchUser> {
    const url = `${this.baseUrl}/auth/twitch/refresh?refreshToken=${refreshToken}`;

    try {
      const { data } = await axios.get<ITwitchUser>(url);

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }

  public async refreshYoutubeToken(refreshToken: string): Promise<ITwitchUser> {
    const url = `${this.baseUrl}/auth/google/refresh?refreshToken=${refreshToken}`;

    try {
      const { data } = await axios.get<ITwitchUser>(url);

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }

  public async refreshKlpqToken(): Promise<IKlpqUser> {
    const url = `${this.baseUrl}/auth`;

    try {
      const { data } = await axios.get<IKlpqUser>(url);

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }

  public async getYoutubeChannels(
    channelName: string,
  ): Promise<IYoutubeChannels> {
    await this.refreshJwtToken();

    if (!this.jwtToken) {
      return;
    }

    const url = `${this.baseUrl}/youtube/channels?channelName=${channelName}`;

    try {
      const { data } = await axios.get<IYoutubeChannels>(url, {
        headers: { jwt: this.jwtToken },
      });

      return data;
    } catch (error) {
      this.handleError(error);

      return;
    }
  }

  public async getYoutubeStreams(channelId: string): Promise<IYoutubeStreams> {
    await this.refreshJwtToken();

    if (!this.jwtToken) {
      return;
    }

    const url = `${this.baseUrl}/youtube/streams?channelId=${channelId}`;

    try {
      const { data } = await axios.get<IYoutubeStreams>(url, {
        headers: { jwt: this.jwtToken },
      });

      return data;
    } catch (error) {
      this.handleError(error);

      return;
    }
  }

  private handleError(error: AxiosError): void {
    addLogs(
      new Error(error.message),
      error?.response?.status,
      error?.response?.data,
    );

    this.jwtToken = null;
  }
}

class CommonClient {
  public async getContentAsBuffer(url: string): Promise<Buffer> {
    try {
      const { data } = await axios.get<Buffer>(url, {
        responseType: 'arraybuffer',
      });

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }
}

interface IGithubLatestVersion {
  tag_name: string;
}

class GithubClient {
  private baseUrl = 'https://api.github.com';

  public async getLatestVersion(): Promise<IGithubLatestVersion> {
    const url = `${this.baseUrl}/repos/rebelvg/KolpaqueClientElectron/releases/latest`;

    try {
      const { data } = await axios.get<IGithubLatestVersion>(url, {
        headers: {
          'user-agent': 'KolpaqueClientElectron',
        },
      });

      return data;
    } catch (error) {
      addLogs(
        new Error(error.message),
        error?.response?.status,
        error?.response?.data,
      );

      return;
    }
  }
}

export const twitchClient = new TwitchClient();
export const klpqStreamClient = new KlpqStreamClient();
export const youtubeClient = new YoutubeClient();
export const chaturbateClient = new ChaturbateClient();
export const klpqServiceClient = new KlpqServiceClient();
export const commonClient = new CommonClient();
export const githubClient = new GithubClient();
