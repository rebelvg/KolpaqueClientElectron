import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';

import { Channel } from './channel-class';
import { REGISTERED_SERVICES } from './globals';
import { sleep } from './helpers';
import { addLogs } from './logs';
import { ServiceNamesEnum } from './stream-services/_base';

ipcMain.on('config_changeSetting', async (event, settingName, settingValue) => {
  addLogs('info', 'config_changeSetting', settingName, settingValue);

  if (settingName === 'enableTwitchImport' && settingValue) {
    await Promise.all(
      REGISTERED_SERVICES.map(async (service) => {
        await service.doImportSettings(true);
      }),
    );
  }
});

ipcMain.on('config_twitchImport', (event, channelName) => {
  addLogs('info', 'config_twitchImport', channelName);

  return runImport();
});

async function runImport(): Promise<boolean> {
  const channels: Channel[] = [];

  try {
    await Promise.all(
      REGISTERED_SERVICES.map(async (service) => {
        switch (service.name) {
          case ServiceNamesEnum.TWITCH:
            const newChannels = await service.doImport([], true);

            channels.push(...newChannels);

            break;

          default:
            break;
        }
      }),
    );

    dialog.showMessageBox({
      type: 'info',
      message: `Import done. ${channels.length} channels added.`,
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
  addLogs('info', 'channel_import_init');

  await Promise.all(
    REGISTERED_SERVICES.map(async (service) => {
      await service.doImportSettings(false);
    }),
  );

  addLogs('info', 'channel_import_init_done');

  (async (): Promise<void> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(10 * 60 * 1000);

      addLogs('info', 'channel_import_loop');

      await Promise.all(
        REGISTERED_SERVICES.map(async (service) => {
          addLogs('info', 'channel_import_loop_service', service.name);

          await service.doImportSettings(true);
        }),
      );
    }
  })();
}
