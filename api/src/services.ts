import * as _ from 'lodash';
import { logger } from './logs';
import { ChaturbateStreamService } from './stream-services/chaturbate';
import { CustomStreamService } from './stream-services/custom';
import { KolpaqueRtmpStreamService } from './stream-services/kolpaque-rtmp';
import { TwitchStreamService } from './stream-services/twitch';
import { YoutubeChannelStreamService } from './stream-services/youtube-channel';
import { YoutubeUserStreamService } from './stream-services/youtube-user';
import { YoutubeUsernameStreamService } from './stream-services/youtube-username';
import { Channel } from './channel-class';
import { BaseStreamService, ServiceNamesEnum } from './stream-services/_base';
import { refreshTrayIconMenuLinux } from './main';
import { KickStreamService } from './stream-services/kick';

class ServiceManager {
  public services: BaseStreamService[] = [
    new KolpaqueRtmpStreamService(),
    new TwitchStreamService(),
    new YoutubeUserStreamService(),
    new YoutubeChannelStreamService(),
    new ChaturbateStreamService(),
    new CustomStreamService(),
    new YoutubeUsernameStreamService(),
    new KickStreamService(),
  ];

  public async checkChannels(channels: Channel[], printBalloon: boolean) {
    logger('info', 'channel_check_stats', channels.length, printBalloon);

    await Promise.all(
      _.map(this.services, async (service) => {
        const serviceChannels = _.filter(channels, {
          service: service,
        });

        logger(
          'debug',
          'channel_check_stats',
          service.name,
          serviceChannels.length,
        );

        await service.getStats(serviceChannels, printBalloon);

        logger(
          'debug',
          'channel_check_stats_done',
          service.name,
          serviceChannels.length,
        );
      }),
    );

    logger('info', 'channel_check_stats_done', channels.length, printBalloon);
  }

  public async doImport(serviceName: ServiceNamesEnum, emitEvent: boolean) {
    const channels: Channel[] = [];

    logger('info', 'channel_import_start', serviceName, emitEvent);

    await Promise.all(
      _.map(this.services, async (service) => {
        logger('debug', 'channel_import_start', service.name);

        if (service.name === serviceName) {
          const newChannels = await service.doImportSettings(emitEvent);

          channels.push(...newChannels);
        }

        logger('debug', 'channel_import_done', service.name);
      }),
    );

    logger('info', 'channel_import_start_done', serviceName, emitEvent);

    return channels;
  }

  public async doImports(emitEvent: boolean) {
    const channels: Channel[] = [];

    await Promise.all(
      _.map(this.services, async (service) => {
        const newChannels = await this.doImport(service.name, emitEvent);

        channels.push(...newChannels);
      }),
    );

    return channels;
  }

  public async getInfoChannels(channels: Channel[]) {
    await Promise.all(
      _.map(this.services, async (service) => {
        const serviceChannels = _.filter(channels, {
          service: service,
        });

        logger(
          'info',
          'channel_info_start',
          service.name,
          serviceChannels.length,
        );

        await service.getInfo(serviceChannels);

        refreshTrayIconMenuLinux();

        logger(
          'info',
          'channel_info_done',
          service.name,
          serviceChannels.length,
        );
      }),
    );
  }

  public async getInfo(serviceName: ServiceNamesEnum) {
    await Promise.all(
      _.map(this.services, async (service) => {
        if (service.name === serviceName) {
          await this.getInfoChannels(service.channels);
        }
      }),
    );
  }
}

export const serviceManager = new ServiceManager();
