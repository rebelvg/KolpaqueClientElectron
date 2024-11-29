import * as _ from 'lodash';

import { config } from './settings-file';
import { addLogs } from './logs';
import { REGISTERED_SERVICES } from './globals';
import { BaseStreamService } from './stream-services/_base';
import { sleep } from './helpers';
import { Channel } from './channel-class';

async function checkService(
  service: BaseStreamService,
  allChannels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  try {
    const channels = _.filter(allChannels, {
      serviceName: service.name,
    });

    addLogs('info', 'channel_check_stats', service.name, channels.length);

    await service.getStats(channels, printBalloon);

    addLogs('info', 'channel_check_stats_done', service.name, channels.length);
  } catch (error) {
    addLogs('error', error);
  }
}

async function checkServiceLoop(service: BaseStreamService): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(service.checkLiveTimeout * 1000);

    await checkService(service, config.channels, true);
  }
}

export async function checkChannels(
  channels: Channel[],
  printBalloon: boolean,
) {
  await Promise.all(
    _.map(REGISTERED_SERVICES, (service) =>
      checkService(service, channels, printBalloon),
    ),
  );
}

export async function loop(): Promise<void> {
  addLogs('info', 'channel_check_init');

  await checkChannels(config.channels, false);

  addLogs('info', 'channel_check_init_done');

  _.forEach(REGISTERED_SERVICES, (service) => checkServiceLoop(service));
}
