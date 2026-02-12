import { AxiosError } from 'axios';
import { getAxios, klpqServiceClient } from '../api-clients';
import { addLogs } from '../logs';
import { config } from '../settings-file';

export interface IKickClientChannels {
  livestream: { is_live: boolean } | null;
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
    return config.settings.kickRefreshToken;
  }

  public set refreshToken(refreshToken: string) {
    addLogs('info', 'KickClient', 'refreshToken', refreshToken);

    config.settings.kickRefreshToken = refreshToken;
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

  public async getChannel(channelName: string) {
    try {
      const { data: channelData } = await this.axios.get<IKickClientChannels>(
        `https://kick.com/api/v1/channels/${channelName}`,
        {
          headers: {
            'User-Agent': `Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0`,
            Accept: `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
            'Accept-Language': `en-US,en;q=0.5`,
            'Accept-Encoding': `gzip, deflate, br, zstd`,
            DNT: `1`,
            'Sec-GPC': `1`,
            Connection: `keep-alive`,
            'Upgrade-Insecure-Requests': `1`,
            'Sec-Fetch-Dest': `document`,
            'Sec-Fetch-Mode': `navigate`,
            'Sec-Fetch-Site': `none`,
            Priority: `u=0, i`,
            Pragma: `no-cache`,
            'Cache-Control': `no-cache`,
            TE: `trailers`,
            Authorization: undefined,
          },
        },
      );

      return channelData;
    } catch (error) {
      addLogs('warn', error);

      return;
    }
  }

  public async validateToken() {
    if (!this._accessToken) {
      throw new Error('no_token');
    }

    await this.axios.post(`${this.baseUrl}/public/v1/token/introspect`);
  }

  private handleError(error: AxiosError): void {
    if (error?.response?.status === 401) {
      this._accessToken = undefined;
    }
  }
}

export const kickClient = new KickClient();
