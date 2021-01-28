import * as _ from 'lodash';

import { config } from './settings-file';
import { addLogs } from './logs';
import { REGISTERED_SERVICES } from './globals';
import { BaseStreamService } from './stream-services/_base';

async function checkService(
  service: BaseStreamService,
  printBalloon: boolean,
): Promise<void> {
  try {
    const channels = _.filter(config.channels, {
      serviceName: service.name,
    });

    await service.getStats(channels, printBalloon);
  } catch (error) {
    addLogs(error);
  }
}

async function checkServiceLoop(service: BaseStreamService): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(service.checkLiveTimeout * 1000);

    await checkService(service, true);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loop(): Promise<void> {
  addLogs('channel_check_init');

  await Promise.all(
    _.map(REGISTERED_SERVICES, (service) => checkService(service, false)),
  );

  addLogs('channel_check_init_done');

  _.forEach(REGISTERED_SERVICES, (service) => checkServiceLoop(service));
}
