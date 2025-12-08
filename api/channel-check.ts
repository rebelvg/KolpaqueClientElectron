import * as _ from 'lodash';

import { config } from './settings-file';
import { sleep } from './helpers';
import { serviceManager } from './services';

export async function loop(): Promise<void> {
  await serviceManager.checkChannels(config.channels, false);

  _.forEach(serviceManager.services, async (service) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(service.checkLiveTimeout * 1000);

      await serviceManager.checkChannels(service.channels, true);
    }
  });
}
