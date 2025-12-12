import { AxiosError } from 'axios';
import { getAxios, klpqServiceClient } from '../api-clients';
import { addLogs } from '../logs';
import { config } from '../settings-file';

export interface IKickClientChannels {
  data: [
    {
      banner_picture: 'https://kick.com/img/default-banner-pictures/default2.jpeg';
      broadcaster_user_id: 123;
      category: {
        id: 101;
        name: 'Old School Runescape';
        thumbnail: 'https://kick.com/img/categories/old-school-runescape.jpeg';
      };
      channel_description: 'Channel description';
      slug: 'john-doe';
      stream: {
        custom_tags: ['tag1', 'tag2'];
        is_live: true;
        is_mature: true;
        key: 'super-secret-stream-key';
        language: 'en';
        start_time: '0001-01-01T00:00:00Z';
        thumbnail: 'https://kick.com/img/default-thumbnail-pictures/default2.jpeg';
        url: 'rtmps://stream.kick.com/1234567890';
        viewer_count: 67;
      };
      stream_title: 'My first stream';
    },
  ];
  message: 'text';
}

class KickClient {
  private baseUrl = 'https://api.kick.com';
  private _accessToken: string | undefined;

  private _accessTokenPromise: Promise<void> | undefined;

  private axios = getAxios();

  constructor() {
    this.axios.interceptors.request.use(async (config) => {
      await this.getAccessToken();

      if (this._accessToken) {
        config.headers.set('Authorization', `Bearer ${this._accessToken}`);
      }

      return config;
    });
  }

  public get refreshToken(): string | null {
    return config.settings.twitchRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    addLogs('info', 'KickClient', 'refreshToken', refreshToken);

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
        .refreshKickToken(this.refreshToken)
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

  public async getChannels(
    channelSlugs: string[],
  ): Promise<IKickClientChannels | undefined> {
    if (channelSlugs.length === 0) {
      return;
    }

    try {
      const { data: streamData } = await this.axios.get<IKickClientChannels>(
        `${this.baseUrl}/public/v1/channels`,
        {
          params: {
            slug: channelSlugs,
          },
        },
      );

      return streamData;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async validateToken() {
    const url = new URL(`https://id.twitch.tv/oauth2/validate`);

    await this.axios.get(url.href);
  }

  private handleError(error: AxiosError): void {
    if (error?.response?.status === 401) {
      this._accessToken = undefined;
    }
  }
}

export const kickClient = new KickClient();
