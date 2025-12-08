import * as _ from 'lodash';

import { config } from './settings-file';
import { serviceManager } from './services';

export function loop() {
  (async () => {
    await serviceManager.getInfoChannels(config.channels);
  })();
}
