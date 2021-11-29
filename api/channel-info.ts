import * as _ from 'lodash';
import { Channel } from './channel-class';

import { REGISTERED_SERVICES } from './globals';
import { addLogs } from './logs';
import { config } from './settings-file';

export async function getChannelInfo(channels: Channel[]) {
  await Promise.all(
    _.map(REGISTERED_SERVICES, async (service) => {
      const filteredChannels = _.filter(channels, {
        serviceName: service.name,
      });

      addLogs('channel_info_start', service.name, filteredChannels.length);

      await service.getInfo(filteredChannels);

      addLogs('channel_info_done', service.name, filteredChannels.length);
    }),
  );
}

export async function loop(): Promise<void> {
  addLogs('channel_info_init');

  await getChannelInfo(config.channels);

  addLogs('channel_info_done');
}
