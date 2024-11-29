import axios, { AxiosError } from 'axios';
import { addLogs } from './logs';
import { config } from './settings-file';
import * as qs from 'querystring';
import { shell, ipcMain } from 'electron';
import * as uuid from 'uuid';
import { sleep } from './helpers';
import { CLIENT_VERSION } from './globals';

const axiosInstance = axios.create({
  timeout: 120 * 1000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    addLogs('debug', 'axios', config.method, config.url, config.params);

    return config;
  },
  (error) => {
    addLogs('error', 'axios_req', error);

    return error;
  },
);

axiosInstance.interceptors.response.use(
  (res) => {
    return res;
  },
  (error) => {
    addLogs('error', 'axios_res', error);

    return error;
  },
);

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
  youtube: boolean | null;
} = {
  twitch: null,
  klpq: null,
  youtube: null,
};

ipcMain.on(
  'getIntegrations',
  (event) => (event.returnValue = integrationState),
);

ipcMain.on('settings_check_tokens', async () => {
  addLogs('info', 'settings_check_tokens');

  integrationState.twitch = null;
  integrationState.klpq = null;
  integrationState.youtube = null;

  config.updateSettingsPage();

  try {
    await twitchClient.validateToken();

    integrationState.twitch = true;
  } catch (error) {
    integrationState.twitch = false;
  }

  try {
    await klpqServiceClient.validateToken();

    integrationState.klpq = true;
  } catch (error) {
    integrationState.klpq = false;
  }

  try {
    await youtubeClient.validateToken();

    integrationState.youtube = true;
  } catch (error) {
    integrationState.youtube = false;
  }

  config.updateSettingsPage();
});

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

  public get refreshToken(): string {
    return config.settings.twitchRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    addLogs('info', 'TwitchClient', 'refreshToken', refreshToken);

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
      const { data: userData } = await axiosInstance.get<ITwitchClientUsers>(
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
      const { data: userData } = await axiosInstance.get<ITwitchClientUsers>(
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
      const {
        data: streamData,
      } = await axiosInstance.get<ITwitchClientStreams>(
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
      const { data } = await axiosInstance.get<ITwitchFollowedChannels>(
        url.href,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            'Client-ID': TWITCH_CLIENT_ID,
          },
        },
      );

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getUsers() {
    const url = new URL(`${this.baseUrl}/users`);

    try {
      const { data } = await axiosInstance.get<{
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

  public async validateToken() {
    const url = new URL(`https://id.twitch.tv/oauth2/validate`);

    await axiosInstance.get(url.href, {
      headers: {
        Authorization: `OAuth ${await this.getAccessToken()}`,
        'Client-ID': TWITCH_CLIENT_ID,
      },
    });

    return;
  }

  private handleError(error: AxiosError): void {
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

  public async getChannel(
    channelName: string,
    host: string,
  ): Promise<IKlpqStreamChannel | undefined> {
    const url = `${this.baseUrl}/channels/${host}/live/${channelName}`;

    try {
      const { data } = await axiosInstance.get<IKlpqStreamChannel>(url);

      return data;
    } catch (error) {
      return;
    }
  }

  public async getChannelsList(): Promise<IKlpqChannelsList | undefined> {
    const url = `${this.baseUrl}/channels/list`;

    try {
      const { data } = await axiosInstance.get<IKlpqChannelsList>(url);

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

  private _accessTokenPromise: Promise<string> | undefined;

  public get refreshToken(): string {
    return config.settings.youtubeRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    addLogs('info', 'YoutubeClient', 'refreshToken', refreshToken);

    config.settings.youtubeRefreshToken = refreshToken;
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
        .refreshYoutubeToken(this.refreshToken)
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
        await this.getAccessToken(),
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
      const data = await klpqServiceClient.getYoutubeStreams(
        channelId,
        await this.getAccessToken(),
      );

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

  public async getChannel(
    channelName: string,
  ): Promise<IChaturbateChannel | undefined> {
    const url = `${this.baseUrl}/`;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    };

    try {
      const { data } = await axiosInstance.post<IChaturbateChannel>(
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
    try {
      const { data } = await axiosInstance.get<ITwitchUser>(
        `${this.baseUrl}/auth/twitch/refresh?refreshToken=${refreshToken}`,
        {
          headers: {
            client_version: CLIENT_VERSION,
          },
        },
      );

      return data;
    } catch (error) {
      return;
    }
  }

  public async refreshYoutubeToken(
    refreshToken: string,
  ): Promise<ITwitchUser | undefined> {
    const url = `${this.baseUrl}/auth/google/refresh?refreshToken=${refreshToken}`;

    try {
      const { data } = await axiosInstance.get<ITwitchUser>(url, {
        headers: {
          client_version: CLIENT_VERSION,
        },
      });

      return data;
    } catch (error) {
      return;
    }
  }

  public async getYoutubeChannels(
    channelName: string,
    accessToken: string,
    forHandle: string | undefined,
  ): Promise<IYoutubeChannels | undefined> {
    const url = `${this.baseUrl}/youtube/channels`;

    const { data } = await axiosInstance.get<IYoutubeChannels>(url, {
      headers: { jwt: this.jwtToken, client_version: CLIENT_VERSION },
      params: {
        channelName,
        accessToken,
        forHandle,
      },
    });

    return data;
  }

  public async getYoutubeStreams(
    channelId: string,
    accessToken: string,
  ): Promise<IYoutubeStreams | undefined> {
    const url = `${this.baseUrl}/youtube/streams`;

    const { data } = await axiosInstance.get<IYoutubeStreams>(url, {
      headers: { jwt: this.jwtToken, client_version: CLIENT_VERSION },
      params: {
        channelId,
        accessToken,
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
      } = await axiosInstance.get<IGetSyncChannels>(
        `${this.baseUrl}/sync/${id}`,
        {
          headers: { jwt: this.jwtToken, client_version: CLIENT_VERSION },
        },
      );

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
      } = await axiosInstance.post<IPostSyncChannels>(
        `${this.baseUrl}/sync`,
        {
          id,
          channels: channels.toString('hex'),
        },
        {
          headers: { jwt: this.jwtToken, client_version: CLIENT_VERSION },
        },
      );

      return newSyncId;
    } catch (error) {
      return;
    }
  }

  public async validateToken() {
    const {
      data: { jwt },
    } = await axiosInstance.get<{ jwt: string }>(
      `${this.baseUrl}/auth/klpq/refresh`,
      {
        headers: { jwt: this.jwtToken, client_version: CLIENT_VERSION },
      },
    );

    this.jwtToken = jwt;
  }
}

class CommonClient {
  public async getContentAsBuffer(url: string): Promise<Buffer | undefined> {
    try {
      const { data } = await axiosInstance.get<Buffer>(url, {
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

  public async getLatestVersion(): Promise<IGithubLatestVersion | undefined> {
    const url = `${this.baseUrl}/repos/rebelvg/KolpaqueClientElectron/releases/latest`;

    try {
      const { data } = await axiosInstance.get<IGithubLatestVersion>(url, {
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

  async getStreamId(channelName: string) {
    const url = `${this.baseUrl}/generate/mpd/live_${channelName}`;

    try {
      const { data } = await axiosInstance.get<{ id: string }>(url);

      return data;
    } catch (error) {
      return;
    }
  }
}

export function loop() {
  (async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await klpqServiceClient.validateToken();
      } catch (error) {}

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
