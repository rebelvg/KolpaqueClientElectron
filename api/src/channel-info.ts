import * as _ from 'lodash';

import { config } from './settings-file';
import { serviceManager } from './services';

export async function init() {
  try {
    await serviceManager.getInfoChannels(config.channels);
  } catch (error) {}
}
