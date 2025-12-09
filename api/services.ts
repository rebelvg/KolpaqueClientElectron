import * as _ from 'lodash';
import { addLogs } from './logs';
import { ChaturbateStreamService } from './stream-services/chaturbate';
import { customStreamService } from './stream-services/custom';
import {
  KolpaqueVpsHttpStreamService,
  KolpaqueVpsHttpStreamServiceNew,
} from './stream-services/kolpaque-vps-http';
import {
  KolpaqueVpsMpdStreamService,
  KolpaqueVpsMpdStreamServiceNew,
} from './stream-services/kolpaque-vps-mpd';
import { KolpaqueVpsRtmpStreamService } from './stream-services/kolpaque-vps-rtmp';
import { twitchStreamService } from './stream-services/twitch';
import { YoutubeChannelStreamService } from './stream-services/youtube-channel';
import { YoutubeUserStreamService } from './stream-services/youtube-user';
import { YoutubeUsernameStreamService } from './stream-services/youtube-username';
import { Channel } from './channel-class';
import { BaseStreamService, ServiceNamesEnum } from './stream-services/_base';
import { refreshTrayIconMenuLinux } from './main';

class ServiceManager {
  public services: BaseStreamService[] = [
    new KolpaqueVpsHttpStreamServiceNew(),
    new KolpaqueVpsMpdStreamServiceNew(),
    new KolpaqueVpsRtmpStreamService(),
    new KolpaqueVpsHttpStreamService(),
    new KolpaqueVpsMpdStreamService(),
    twitchStreamService,
    new YoutubeUserStreamService(),
    new YoutubeChannelStreamService(),
    new ChaturbateStreamService(),
    customStreamService,
    new YoutubeUsernameStreamService(),
  ];

  public async checkChannels(channels: Channel[], printBalloon: boolean) {
    addLogs('info', 'channel_check_stats', channels.length, printBalloon);

    await Promise.all(
      _.map(this.services, async (service) => {
        const serviceChannels = _.filter(channels, {
          serviceObj: service,
        });

        addLogs(
          'debug',
          'channel_check_stats',
          service.name,
          serviceChannels.length,
        );

        await service.getStats(serviceChannels, printBalloon);

        addLogs(
          'debug',
          'channel_check_stats_done',
          service.name,
          serviceChannels.length,
        );
      }),
    );

    addLogs('info', 'channel_check_stats_done', channels.length, printBalloon);
  }

  public async doImport(serviceName: ServiceNamesEnum, emitEvent: boolean) {
    const channels: Channel[] = [];

    addLogs('info', 'channel_import_start', serviceName, emitEvent);

    await Promise.all(
      _.map(this.services, async (service) => {
        addLogs('debug', 'channel_import_start', service.name);

        if (service.name === serviceName) {
          const newChannels = await service.doImportSettings(emitEvent);

          channels.push(...newChannels);
        }

        addLogs('debug', 'channel_import_done', service.name);
      }),
    );

    addLogs('info', 'channel_import_start_done', serviceName, emitEvent);

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
          serviceObj: service,
        });

        addLogs(
          'info',
          'channel_info_start',
          service.name,
          serviceChannels.length,
        );

        await service.getInfo(serviceChannels);

        refreshTrayIconMenuLinux();

        addLogs(
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
