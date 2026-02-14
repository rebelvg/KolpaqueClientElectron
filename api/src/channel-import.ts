import { ipcMain, dialog, IpcMainEvent } from 'electron';
import * as _ from 'lodash';

import { sleep } from './helpers';
import { logger } from './logs';
import { ServiceNamesEnum } from './stream-services/_base';
import { serviceManager } from './services';
import { main } from './main';

const isTrustedSender = (event: IpcMainEvent) =>
  main.mainWindow ? event.sender === main.mainWindow.webContents : false;

ipcMain.on(
  'config_changeSetting_app',
  async (event, settingName, settingValue) => {
    logger('info', 'config_changeSetting_app', settingName, settingValue);

    if (!isTrustedSender(event)) {
      logger('warn', 'config_changeSetting_app_blocked');

      return;
    }

    if (settingName === 'enableTwitchImport' && settingValue) {
      await serviceManager.doImport(ServiceNamesEnum.TWITCH, true);
    }
  },
);

ipcMain.on('config_twitchImport', (event, channelName) => {
  logger('info', 'config_twitchImport', channelName);

  if (!isTrustedSender(event)) {
    logger('warn', 'config_twitchImport_blocked');

    return false;
  }

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

export async function init(): Promise<void> {
  await serviceManager.doImports(false);

  (async (): Promise<void> => {
    while (true) {
      await sleep(10 * 60 * 1000);

      await serviceManager.doImports(false);
    }
  })();
}
