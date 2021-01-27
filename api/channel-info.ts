import * as _ from 'lodash';

import { REGISTERED_SERVICES } from './globals';
import { config } from './settings-file';

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
