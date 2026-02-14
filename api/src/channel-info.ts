import * as _ from 'lodash';

import { config } from './settings-file';
import { serviceManager } from './services';

export async function init() {
  try {
    await Promise.all(
      serviceManager.services.map((service) =>
        serviceManager.info(service.name),
      ),
    );
  } catch (error) {}
}
