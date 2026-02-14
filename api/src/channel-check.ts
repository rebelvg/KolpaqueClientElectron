import * as _ from 'lodash';

import { config } from './settings-file';
import { sleep } from './helpers';
import { serviceManager } from './services';

export async function init(): Promise<void> {
  await serviceManager.checkChannels(config.channels, false);

  _.forEach(serviceManager.services, async (service) => {
    while (true) {
      await sleep(service.checkLiveTimeout * 1000);

      await serviceManager.checkChannels(service.channels, true);
    }
  });
}
