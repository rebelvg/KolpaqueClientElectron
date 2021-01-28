import * as _ from 'lodash';

import { REGISTERED_SERVICES } from './globals';
import { addLogs } from './logs';
import { config } from './settings-file';

export async function loop(): Promise<void> {
  addLogs('channel_info_init');

  await Promise.all(
    _.map(REGISTERED_SERVICES, async (service) => {
      const filteredChannels = _.filter(config.channels, {
        serviceName: service.name,
      });

      await service.getInfo(filteredChannels);
    }),
  );

  addLogs('channel_info_done');
}
