import axios, { AxiosError, AxiosInstance } from 'axios';
import { addLogs } from './logs';
import { config } from './settings-file';
import * as qs from 'querystring';
import { shell, ipcMain } from 'electron';
import * as uuid from 'uuid';

const TWITCH_CLIENT_ID = 'dk330061dv4t81s21utnhhdona0a91x';

export const KLPQ_SERVICE_URL = 'https://kolpaque-client-api.klpq.io';
// export const KLPQ_SERVICE_URL = 'http://localhost:3000';
export const SOCKET_CLIENT_ID = uuid.v4();

export interface ITwitchUser {
  accessToken: string;
  refreshToken: string;
}

ipcMain.on('twitch_login', async () => {
  addLogs('info', 'twitch_login');

  await klpqServiceClient.getTwitchUser();
});

ipcMain.on('youtube_login', async () => {
  addLogs('info', 'youtube_login');

  await klpqServiceClient.getYoutubeUser();
});

ipcMain.on('klpq_login', async () => {
  addLogs('info', 'klpq_login');

  await klpqServiceClient.getKlpqUser();
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
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  followed_at: string;
}

export const TWITCH_CHUNK_LIMIT = 100;

class TwitchClient {
  private baseUrl = 'https://api.twitch.tv/helix';
  private _accessToken: string | undefined;

  private _accessTokenPromise: Promise<string> | undefined;

  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        addLogs('info', 'axios', req.url);

        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  public get refreshToken(): string {
    return config.settings.twitchRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    config.settings.twitchRefreshToken = refreshToken;
  }

  private getAccessToken(): Promise<string> {
    if (this._accessToken) {
      return Promise.resolve(this._accessToken);
    }

    if (this._accessTokenPromise) {
      return this._accessTokenPromise;
    }

    const promise = new Promise<string>((resolve, reject) => {
      klpqServiceClient
        .refreshTwitchToken(this.refreshToken)
        .then((user) => {
          this._accessTokenPromise = undefined;

          if (!user) {
            return reject('no_user');
          }

          this._accessToken = user.accessToken;
          this.refreshToken = user.refreshToken;

          return resolve(user.accessToken);
        })
        .catch((error) => {
          this._accessTokenPromise = undefined;

          reject(error);
        });
    });

    this._accessTokenPromise = promise;

    return promise;
  }

  public async getUsersByLogin(
    channelNames: string[],
    callerName: string,
  ): Promise<ITwitchClientUsers | undefined> {
    if (channelNames.length === 0) {
      return;
    }

    try {
      const { data: userData } = await this.axios.get<ITwitchClientUsers>(
        `${this.baseUrl}/users?${channelNames
          .map((channelName) => `login=${channelName}`)
          .join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            'Client-ID': TWITCH_CLIENT_ID,
          },
        },
      );

      return userData;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getUsersById(
    ids: string[],
  ): Promise<ITwitchClientUsers | undefined> {
    if (ids.length === 0) {
      return;
    }

    try {
      const { data: userData } = await this.axios.get<ITwitchClientUsers>(
        `${this.baseUrl}/users?${ids.map((id) => `id=${id}`).join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            'Client-ID': TWITCH_CLIENT_ID,
          },
        },
      );

      return userData;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getStreams(
    userIds: string[],
  ): Promise<ITwitchClientStreams | undefined> {
    if (userIds.length === 0) {
      return;
    }

    try {
      const { data: streamData } = await this.axios.get<ITwitchClientStreams>(
        `${this.baseUrl}/streams/?${userIds
          .map((userId) => `user_id=${userId}`)
          .join('&')}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
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
  ): Promise<ITwitchFollowedChannels | undefined> {
    const url = new URL(`${this.baseUrl}/channels/followed?user_id=${userId}`);

    url.searchParams.set('first', '100');
    url.searchParams.set('after', after);

    try {
      const { data } = await this.axios.get<ITwitchFollowedChannels>(url.href, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Client-ID': TWITCH_CLIENT_ID,
        },
      });

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getUsers() {
    const url = new URL(`${this.baseUrl}/users`);

    try {
      const { data } = await this.axios.get<{
        data: [
          {
            id: string;
            login: string;
            display_name: string;
            type: string;
            broadcaster_type: string;
            description: string;
            profile_image_url: string;
            offline_image_url: string;
            view_count: number;
            email: string;
            created_at: string;
          },
        ];
      }>(url.href, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Client-ID': TWITCH_CLIENT_ID,
        },
      });

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: AxiosError): void {
    addLogs('error', error);

    if (error?.response?.status === 401) {
      this._accessToken = undefined;
    }
  }
}

export interface IKlpqStreamChannel {
  isLive: boolean;
}

export interface IKlpqChannelsList {
  channels: string[];
}

class KlpqStreamClient {
  private baseUrl = 'https://stats-api.klpq.io';

  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        addLogs('info', 'axios', req.url);

        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  public async getChannel(
    channelName: string,
    host: string,
  ): Promise<IKlpqStreamChannel | undefined> {
    const url = `${this.baseUrl}/channels/${host}/live/${channelName}`;

    try {
      const { data } = await this.axios.get<IKlpqStreamChannel>(url);

      return data;
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }

  public async getChannelsList(): Promise<IKlpqChannelsList | undefined> {
    const url = `${this.baseUrl}/channels/list`;

    try {
      const { data } = await this.axios.get<IKlpqChannelsList>(url);

      return data;
    } catch (error) {
      addLogs('error', error);

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

export interface IGetSyncChannels {
  id: string;
  channels: string;
}

export interface IPostSyncChannels {
  id: string;
}

class YoutubeClient {
  public accessToken: string;

  public get refreshToken(): string {
    return config.settings.youtubeRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    config.settings.youtubeRefreshToken = refreshToken;
  }

  public async refreshAccessToken(): Promise<boolean | undefined> {
    if (this.accessToken) {
      return;
    }

    if (!this.refreshToken) {
      addLogs('error', 'no_youtube_refresh_token');

      return false;
    }

    const user = await klpqServiceClient.refreshYoutubeToken(this.refreshToken);

    if (!user) {
      addLogs('info', 'refresh_youtube_access_token_failed');

      return false;
    }

    this.accessToken = user.accessToken;
    this.refreshToken = user.refreshToken;

    addLogs('info', 'youtube_new_access_token');

    return true;
  }

  public async getChannels(
    channelName: string,
  ): Promise<IYoutubeChannels | undefined> {
    if (!config.settings.youtubeTosConsent) {
      return;
    }

    return await klpqServiceClient.getYoutubeChannels(channelName);
  }

  public async getStreams(
    channelId: string,
  ): Promise<IYoutubeStreams | undefined> {
    if (!config.settings.youtubeTosConsent) {
      return;
    }

    return await klpqServiceClient.getYoutubeStreams(channelId);
  }
}

export interface IChaturbateChannel {
  room_status: string;
  url: string;
}

class ChaturbateClient {
  private baseUrl = 'https://chaturbate.com/get_edge_hls_url_ajax';

  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        addLogs('info', 'axios', req.url);

        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  public async getChannel(
    channelName: string,
  ): Promise<IChaturbateChannel | undefined> {
    const url = `${this.baseUrl}/`;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    };

    try {
      const { data } = await this.axios.post<IChaturbateChannel>(
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
      addLogs('error', error);

      return;
    }
  }
}

class KlpqServiceClient {
  private baseUrl = KLPQ_SERVICE_URL;

  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        addLogs('info', 'axios', req.url);

        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  public get jwtToken(): string | null {
    return config.settings.klpqJwtToken;
  }

  public set jwtToken(jwtToken: string | null) {
    config.settings.klpqJwtToken = jwtToken;
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

  public async getKlpqUser(): Promise<void> {
    await shell.openExternal(
      `${this.baseUrl}/auth/klpq?requestId=${SOCKET_CLIENT_ID}`,
    );
  }

  public async refreshTwitchToken(
    refreshToken: string,
  ): Promise<ITwitchUser | undefined> {
    addLogs('info', 'refreshTwitchToken', refreshToken);

    try {
      const { data } = await this.axios.get<ITwitchUser>(
        `${this.baseUrl}/auth/twitch/refresh?refreshToken=${refreshToken}`,
      );

      return data;
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }

  public async refreshYoutubeToken(
    refreshToken: string,
  ): Promise<ITwitchUser | undefined> {
    const url = `${this.baseUrl}/auth/google/refresh?refreshToken=${refreshToken}`;

    try {
      const { data } = await this.axios.get<ITwitchUser>(url);

      return data;
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }

  public async getYoutubeChannels(
    channelName: string,
  ): Promise<IYoutubeChannels | undefined> {
    if (!this.jwtToken) {
      return;
    }

    const url = `${this.baseUrl}/youtube/channels?channelName=${channelName}`;

    try {
      const { data } = await this.axios.get<IYoutubeChannels>(url, {
        headers: { jwt: this.jwtToken },
      });

      return data;
    } catch (error) {
      this.handleError(error);

      return;
    }
  }

  public async getYoutubeStreams(
    channelId: string,
  ): Promise<IYoutubeStreams | undefined> {
    if (!this.jwtToken) {
      return;
    }

    const url = `${this.baseUrl}/youtube/streams?channelId=${channelId}`;

    try {
      const { data } = await this.axios.get<IYoutubeStreams>(url, {
        headers: { jwt: this.jwtToken },
      });

      return data;
    } catch (error) {
      this.handleError(error);

      return;
    }
  }

  public async getSyncChannels(id: string): Promise<Buffer | undefined> {
    if (!this.jwtToken) {
      return;
    }

    try {
      const {
        data: { channels },
      } = await this.axios.get<IGetSyncChannels>(`${this.baseUrl}/sync/${id}`, {
        headers: { jwt: this.jwtToken },
      });

      return Buffer.from(channels, 'hex');
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }

  public async saveSyncChannels(
    id: string | undefined,
    channels: Buffer,
  ): Promise<string | undefined> {
    if (!this.jwtToken) {
      return;
    }

    try {
      const {
        data: { id: newSyncId },
      } = await this.axios.post<IPostSyncChannels>(
        `${this.baseUrl}/sync`,
        {
          id,
          channels: channels.toString('hex'),
        },
        {
          headers: { jwt: this.jwtToken },
        },
      );

      return newSyncId;
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }

  private handleError(error: AxiosError): void {
    addLogs('error', error);

    return;
  }
}

class CommonClient {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  public async getContentAsBuffer(url: string): Promise<Buffer | undefined> {
    try {
      const { data } = await this.axios.get<Buffer>(url, {
        responseType: 'arraybuffer',
        timeout: 120 * 1000,
      });

      return data;
    } catch (error) {
      addLogs('error', 'COMMON_CLIENT_GET_PICTURE_ERROR', error);

      return;
    }
  }
}

interface IGithubLatestVersion {
  tag_name: string;
}

class GithubClient {
  private baseUrl = 'https://api.github.com';

  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        addLogs('info', 'axios', req.url);

        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  public async getLatestVersion(): Promise<IGithubLatestVersion | undefined> {
    const url = `${this.baseUrl}/repos/rebelvg/KolpaqueClientElectron/releases/latest`;

    try {
      const { data } = await this.axios.get<IGithubLatestVersion>(url, {
        headers: {
          'user-agent': 'KolpaqueClientElectron',
        },
      });

      return data;
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }
}

class KlpqEncodeClient {
  private baseUrl = 'https://encode.klpq.io';

  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      timeout: 120 * 1000,
    });

    this.axios.interceptors.request.use(
      (req) => {
        addLogs('info', 'axios', req.url);

        return req;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );

    this.axios.interceptors.request.use(
      (res) => {
        return res;
      },
      (error) => {
        addLogs('error', 'axios', error);

        return error;
      },
    );
  }

  async getStreamId(channelName: string) {
    const url = `${this.baseUrl}/generate/mpd/live_${channelName}`;

    try {
      const { data } = await this.axios.get<{ id: string }>(url);

      return data;
    } catch (error) {
      addLogs('error', error);

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
export const klpqEncodeClient = new KlpqEncodeClient();
