import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';

import { sleep } from './helpers';
import { addLogs } from './logs';
import { ServiceNamesEnum } from './stream-services/_base';
import { serviceManager } from './services';

ipcMain.on('config_changeSetting', async (event, settingName, settingValue) => {
  addLogs('info', 'config_changeSetting', settingName, settingValue);

  if (settingName === 'enableTwitchImport' && settingValue) {
    await serviceManager.doImport(ServiceNamesEnum.TWITCH, true);
  }
});

ipcMain.on('config_twitchImport', (event, channelName) => {
  addLogs('info', 'config_twitchImport', channelName);

  return twitchImportAndMessage();
});

async function twitchImportAndMessage(): Promise<boolean> {
  try {
    const newChannels = await serviceManager.doImport(
      ServiceNamesEnum.TWITCH,
      true,
    );

    dialog.showMessageBox({
      type: 'info',
      message: `Import done. ${newChannels.length} channels added.`,
    });

    return true;
  } catch (error) {
    dialog.showMessageBox({
      type: 'error',
      message: 'Import error.',
    });

    return false;
  }
}

export async function loop(): Promise<void> {
  await serviceManager.doImports(false);

  (async (): Promise<void> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(10 * 60 * 1000);

      await serviceManager.doImports(false);
    }
  })();
}
