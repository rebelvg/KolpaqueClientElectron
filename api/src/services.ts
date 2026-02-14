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
import { main, refreshTrayIconMenuLinux } from './main';
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

  public async check(service: BaseStreamService, printBalloon: boolean) {
    logger('info', 'check', service.name, printBalloon);

    const channels = service.channels;

    await service.getStats(channels, printBalloon);

    logger('info', 'check_done', service.name, channels.length, printBalloon);
  }

  public async import(serviceName: ServiceNamesEnum) {
    logger('info', 'import', serviceName);

    const channels: Channel[] = [];

    const service = _.find(
      this.services,
      (service) => service.name === serviceName,
    );

    if (service) {
      const newChannels = await service.doImportSettings();

      channels.push(...newChannels);
    }

    logger('info', 'import_done', serviceName, channels.length);

    return channels;
  }

  public async info(serviceName: ServiceNamesEnum) {
    logger('info', 'info', serviceName);

    const service = _.find(
      this.services,
      (service) => service.name === serviceName,
    );

    if (service) {
      const online = service.channels.filter((c) => c.isLive);
      const offline = service.channels.filter((c) => !c.isLive);

      for (const channels of [online, offline]) {
        const count = await service.getInfo(channels);

        if (count > 0) {
          refreshTrayIconMenuLinux();

          main.mainWindow!.webContents.send('runChannelUpdates', __filename);
        }
      }
    }

    logger('info', 'info_done', serviceName);
  }
}

export const serviceManager = new ServiceManager();
