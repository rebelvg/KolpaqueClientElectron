import * as _ from 'lodash';

import { Channel } from './channel-class';
import { REGISTERED_SERVICES } from './globals';
import { config } from './settings-file';

config.on('channel_added', async (channel: Channel) => {
  await checkChannels([channel]);
});

config.on('channel_added_channels', async (channels: Channel[]) => {
  await checkChannels(channels);
});

async function checkChannels(channels: Channel[]): Promise<void> {
  await Promise.all(
    REGISTERED_SERVICES.map(async (service) => {
      const filteredChannels = _.filter(channels, {
        serviceName: service.name,
      });

      await service.getInfo(filteredChannels);
    }),
  );
}

export async function loop(): Promise<void> {
  await Promise.all(
    _.map(REGISTERED_SERVICES, async (service) => {
      const filteredChannels = _.filter(config.channels, {
        serviceName: service.name,
      });

      await service.getInfo(filteredChannels);
    }),
  );
}
