import axios, { AxiosError } from 'axios';
import { addLogs } from './logs';
import { config } from './settings-file';
import * as qs from 'querystring';
import { shell, ipcMain } from 'electron';
import * as uuid from 'uuid';
import { sleep } from './helpers';
import { CLIENT_VERSION } from './globals';
import { kickClient } from './clients/kick';

export function getAxios() {
  const axiosInstance = axios.create({
    timeout: 120 * 1000,
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      addLogs('debug', 'axios', config.method, config.url, config.params);

      return config;
    },
    (error) => {
      addLogs('warn', 'axios_req', error);

      return Promise.reject(error);
    },
  );

  axiosInstance.interceptors.response.use(
    (res) => {
      addLogs('debug', 'axios', res.config.method, res.config.url, res.status);

      return res;
    },
    (error) => {
      addLogs('warn', 'axios_res', error);

      return Promise.reject(error);
    },
  );

  return axiosInstance;
}

const TWITCH_CLIENT_ID = 'dk330061dv4t81s21utnhhdona0a91x';

export const KLPQ_SERVICE_URL = 'https://kolpaque-client-api.klpq.io';
// export const KLPQ_SERVICE_URL = 'http://localhost:3000';
export const SOCKET_CLIENT_ID = uuid.v4();

export interface ITwitchUser {
  accessToken: string;
  refreshToken: string;
}

const integrationState: {
  twitch: boolean | null;
  klpq: boolean | null;
  kick: boolean | null;
} = {
  twitch: null,
  klpq: null,
  kick: null,
};

ipcMain.on(
  'getIntegrations',
  (event) => (event.returnValue = integrationState),
);

ipcMain.on('settings_check_tokens', async () => {
  addLogs('info', 'settings_check_tokens');

  integrationState.twitch = null;
  integrationState.klpq = null;

  config.updateSettingsPage();

  try {
    await twitchClient.validateToken();

    integrationState.twitch = true;
  } catch (error) {
    integrationState.twitch = false;
  }

  try {
    await kickClient.validateToken();

    integrationState.kick = true;
  } catch (error) {
    integrationState.kick = false;
  }

  try {
    await klpqServiceClient.refreshKlpqToken();

    integrationState.klpq = true;
  } catch (error) {
    integrationState.klpq = false;
  }

  config.updateSettingsPage();
});

ipcMain.on('twitch_login', async () => {
  addLogs('info', 'twitch_login');

  await klpqServiceClient.getTwitchUser();
});

ipcMain.on('kick_login', async () => {
  addLogs('info', 'kick_login');

  await klpqServiceClient.getKickUser();
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

  private _accessTokenPromise: Promise<void> | undefined;

  private axios = getAxios();

  constructor() {
    this.axios.interceptors.request.use(async (config) => {
      await this.getAccessToken();

      if (this._accessToken) {
        config.headers.set('Authorization', `Bearer ${this._accessToken}`);
      }

      config.headers.set('Client-ID', TWITCH_CLIENT_ID);

      return config;
    });
  }

  public get refreshToken(): string | null {
    return config.settings.twitchRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    addLogs('info', 'TwitchClient', 'refreshToken', refreshToken);

    config.settings.twitchRefreshToken = refreshToken;
  }

  public getAccessToken(force = false): Promise<void> {
    if (!force) {
      if (this._accessToken) {
        return Promise.resolve();
      }

      if (this._accessTokenPromise) {
        return this._accessTokenPromise;
      }
    }

    const promise = new Promise<void>((resolve, reject) => {
      klpqServiceClient
        .refreshTwitchToken(this.refreshToken)
        .then((user) => {
          this._accessTokenPromise = undefined;

          if (!user) {
            return resolve();
          }

          this._accessToken = user.accessToken;
          this.refreshToken = user.refreshToken;

          return resolve();
        })
        .catch((error) => {
          this._accessTokenPromise = undefined;

          resolve();
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
        `${this.baseUrl}/users`,
        {
          params: {
            login: channelNames,
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
        `${this.baseUrl}/users`,
        {
          params: {
            id: ids,
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
        `${this.baseUrl}/streams`,
        {
          params: {
            user_id: userIds,
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
    const url = new URL(`${this.baseUrl}/channels/followed`);

    try {
      const { data } = await this.axios.get<ITwitchFollowedChannels>(url.href, {
        params: {
          user_id: userId,
          first: '100',
          after,
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
      }>(url.href);

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async validateToken() {
    if (!this._accessToken) {
      throw new Error('no_token');
    }

    await this.axios.get(`https://id.twitch.tv/oauth2/validate`);
  }

  private handleError(error: AxiosError): void {
    if (error?.response?.status === 401) {
      this._accessToken = undefined;
    }
  }
}

export interface IKlpqStreamChannel {
  streams: {
    isLive: boolean;
    name: string;
    protocol: 'rtmp' | 'flv' | 'hls' | 'mpd';
    app: string;
    urls: {
      web: string;
      edge: string;
    };
  }[];
}

class KlpqStreamClient {
  private baseUrl = 'https://stats-api.klpq.io/v1';

  private axios = getAxios();

  public async getChannel(
    channelName: string,
  ): Promise<IKlpqStreamChannel | undefined> {
    const url = `${this.baseUrl}/channels/${channelName}`;

    try {
      const { data } = await this.axios.get<IKlpqStreamChannel>(url);

      return data;
    } catch (error) {
      return;
    }
  }
}

export interface IYoutubeChannels {
  items: Array<{ id: string }>;
}

export interface IYoutubeStreams {
  items: null[];
}

export interface IGetSyncChannels {
  id: string;
  channels: string;
}

export interface IPostSyncChannels {
  id: string;
}

class YoutubeClient {
  private _accessToken: string | undefined;

  private _accessTokenPromise: Promise<void> | undefined;

  public get refreshToken(): string | null {
    return config.settings.youtubeRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    addLogs('info', 'YoutubeClient', 'refreshToken', refreshToken);

    config.settings.youtubeRefreshToken = refreshToken;
  }

  private getAccessToken(): Promise<void> {
    if (this._accessToken) {
      return Promise.resolve();
    }

    if (this._accessTokenPromise) {
      return this._accessTokenPromise;
    }

    const promise = new Promise<void>((resolve, reject) => {
      klpqServiceClient
        .refreshYoutubeToken(this.refreshToken)
        .then((user) => {
          this._accessTokenPromise = undefined;

          if (!user) {
            return resolve();
          }

          this._accessToken = user.accessToken;
          this.refreshToken = user.refreshToken;

          return resolve();
        })
        .catch((error) => {
          this._accessTokenPromise = undefined;

          resolve();
        });
    });

    this._accessTokenPromise = promise;

    return promise;
  }

  public async validateToken() {
    const res = await klpqServiceClient.refreshYoutubeToken(this.refreshToken);

    if (!res) {
      throw new Error('no_token');
    }

    this.refreshToken = res.refreshToken;
  }

  public async refreshAccessToken(): Promise<boolean | undefined> {
    if (!this.refreshToken) {
      return false;
    }

    const user = await klpqServiceClient.refreshYoutubeToken(this.refreshToken);

    if (!user) {
      return false;
    }

    this.refreshToken = user.refreshToken;

    return true;
  }

  public async getChannels(
    channelName: string,
    forHandle: string | undefined,
  ): Promise<IYoutubeChannels | undefined> {
    if (!config.settings.youtubeTosConsent) {
      return;
    }

    try {
      const data = await klpqServiceClient.getYoutubeChannels(
        channelName,
        forHandle,
      );

      return data;
    } catch (error) {
      this._accessToken = undefined;
    }
  }

  public async getStreams(
    channelId: string,
  ): Promise<IYoutubeStreams | undefined> {
    if (!config.settings.youtubeTosConsent) {
      return;
    }

    try {
      const data = await klpqServiceClient.getYoutubeStreams(channelId);

      return data;
    } catch (error) {
      this._accessToken = undefined;
    }
  }
}

export interface IChaturbateChannel {
  room_status: string;
  url: string;
}

class ChaturbateClient {
  private baseUrl = 'https://chaturbate.com/get_edge_hls_url_ajax';

  private axios = getAxios();

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
      return;
    }
  }
}

class KlpqServiceClient {
  private baseUrl = KLPQ_SERVICE_URL;

  private axios = getAxios();

  constructor() {
    this.axios.interceptors.request.use((config) => {
      config.headers.set('client-version', CLIENT_VERSION);
      config.headers.set('jwt', this.jwtToken);

      return config;
    });
  }

  public get jwtToken(): string | null {
    return config.settings.klpqJwtToken;
  }

  public set jwtToken(jwtToken: string | null) {
    addLogs('info', 'KlpqServiceClient', 'jwtToken', jwtToken);

    config.settings.klpqJwtToken = jwtToken;
  }

  public async getTwitchUser(): Promise<void> {
    await shell.openExternal(
      `${this.baseUrl}/auth/twitch?requestId=${SOCKET_CLIENT_ID}`,
    );
  }

  public async getKickUser(): Promise<void> {
    await shell.openExternal(
      `${this.baseUrl}/auth/kick?requestId=${SOCKET_CLIENT_ID}`,
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
    refreshToken: string | null,
  ): Promise<ITwitchUser | undefined> {
    if (!refreshToken) {
      return;
    }

    try {
      const { data } = await this.axios.get<ITwitchUser>(
        `${this.baseUrl}/auth/twitch/refresh`,
        {
          params: {
            refreshToken,
          },
        },
      );

      return data;
    } catch (error) {
      return;
    }
  }

  public async refreshKickToken(
    refreshToken: string | null,
  ): Promise<ITwitchUser | undefined> {
    if (!refreshToken) {
      return;
    }

    try {
      const { data } = await this.axios.get<ITwitchUser>(
        `${this.baseUrl}/auth/kick/refresh`,
        {
          params: {
            refreshToken,
          },
        },
      );

      return data;
    } catch (error) {
      return;
    }
  }

  public async refreshKlpqToken() {
    if (!this.jwtToken) {
      return;
    }

    try {
      const {
        data: { jwt },
      } = await this.axios.get<{ jwt: string }>(
        `${this.baseUrl}/auth/klpq/refresh`,
      );

      this.jwtToken = jwt;
    } catch (error) {
      if (error instanceof AxiosError && !!error.response?.status) {
        this.jwtToken = null;
      }
    }
  }

  public async refreshYoutubeToken(
    refreshToken: string | null,
  ): Promise<ITwitchUser | undefined> {
    const url = `${this.baseUrl}/auth/google/refresh`;

    try {
      const { data } = await this.axios.get<ITwitchUser>(url, {
        params: {
          refreshToken,
        },
      });

      return data;
    } catch (error) {
      return;
    }
  }

  public async getYoutubeChannels(
    channelName: string,
    forHandle: string | undefined,
  ): Promise<IYoutubeChannels | undefined> {
    const url = `${this.baseUrl}/youtube/channels`;

    const { data } = await this.axios.get<IYoutubeChannels>(url, {
      params: {
        channelName,
        forHandle,
      },
    });

    return data;
  }

  public async getYoutubeStreams(
    channelId: string,
  ): Promise<IYoutubeStreams | undefined> {
    const url = `${this.baseUrl}/youtube/streams`;

    const { data } = await this.axios.get<IYoutubeStreams>(url, {
      params: {
        channelId,
      },
    });

    return data;
  }

  public async getSyncChannels(id: string): Promise<Buffer | undefined> {
    if (!this.jwtToken) {
      return;
    }

    try {
      const {
        data: { channels },
      } = await this.axios.get<IGetSyncChannels>(`${this.baseUrl}/sync/${id}`);

      return Buffer.from(channels, 'hex');
    } catch (error) {
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
      } = await this.axios.post<IPostSyncChannels>(`${this.baseUrl}/sync`, {
        id,
        channels: channels.toString('hex'),
      });

      return newSyncId;
    } catch (error) {
      return;
    }
  }
}

class CommonClient {
  private axios = getAxios();

  public async getContentAsBuffer(url: string): Promise<Buffer | undefined> {
    try {
      const { data } = await this.axios.get<Buffer>(url, {
        responseType: 'arraybuffer',
        timeout: 120 * 1000,
      });

      return data;
    } catch (error) {
      return;
    }
  }
}

interface IGithubLatestVersion {
  tag_name: string;
}

class GithubClient {
  private baseUrl = 'https://api.github.com';

  private axios = getAxios();

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
      return;
    }
  }
}

class KlpqEncodeClient {
  private baseUrl = 'https://encode.klpq.io';

  private axios = getAxios();

  async getStreamId(channelName: string) {
    const url = `${this.baseUrl}/generate/mpd/live_${channelName}`;

    try {
      const { data } = await this.axios.get<{ id: string }>(url);

      return data;
    } catch (error) {
      return;
    }
  }
}

export function clientLoop() {
  (async () => {
    while (true) {
      await Promise.allSettled([
        klpqServiceClient.refreshKlpqToken(),
        twitchClient.getAccessToken(true),
      ]);

      await sleep(30 * 60 * 1000);
    }
  })();
}

export const twitchClient = new TwitchClient();
export const klpqStreamClient = new KlpqStreamClient();
export const youtubeClient = new YoutubeClient();
export const chaturbateClient = new ChaturbateClient();
export const klpqServiceClient = new KlpqServiceClient();
export const commonClient = new CommonClient();
export const githubClient = new GithubClient();
export const klpqEncodeClient = new KlpqEncodeClient();
