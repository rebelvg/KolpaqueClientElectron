import * as _ from 'lodash';

import { config } from './settings-file';
import { Channel } from './channel-class';
import { addLogs } from './logs';
import { REGISTERED_SERVICES } from './globals';
import { BaseStreamService } from './stream-services/_base';

config.on('channel_added', async (channel: Channel) => {
  await checkChannels([channel], false);
});

config.on('channel_added_channels', async (channels: Channel[]) => {
  await checkChannels(channels, false);
});

async function checkChannels(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    REGISTERED_SERVICES.map(async (service) => {
      const channels = _.filter(channelObjs, {
        serviceName: service.name,
      });

      await service.checkChannels(channels, printBalloon);
    }),
  );
}

async function checkService(
  service: BaseStreamService,
  printBalloon: boolean,
): Promise<void> {
  try {
    const channels = _.filter(config.channels, {
      serviceName: service.name,
    });

    await service.checkChannels(channels, printBalloon);
  } catch (error) {
    addLogs(error);
  }
}

async function checkServiceLoop(
  service: BaseStreamService,
  printBalloon: boolean,
): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(service.checkLiveTimeout * 1000);

    await checkService(service, printBalloon);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loop(): Promise<void> {
  await Promise.all(
    _.map(REGISTERED_SERVICES, (service) => checkService(service, false)),
  );

  _.forEach(REGISTERED_SERVICES, (service) => checkServiceLoop(service, true));
}
