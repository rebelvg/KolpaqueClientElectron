import * as _ from 'lodash';

import { sleep } from './helpers';
import { serviceManager } from './services';

export async function init() {
  await Promise.all(
    serviceManager.services.map(async (service) => {
      await serviceManager.check(service, false);
    }),
  );

  _.forEach(serviceManager.services, async (service) => {
    while (true) {
      await sleep(service.checkLiveTimeout * 1000);

      await serviceManager.check(service, true);
    }
  });
}
