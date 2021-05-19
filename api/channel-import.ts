import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';

import { Channel } from './channel-class';
import { REGISTERED_SERVICES } from './globals';
import { sleep } from './helpers';
import { addLogs } from './logs';
import { ServiceNamesEnum } from './stream-services/_base';

ipcMain.on('config_twitchImport', (event, channelName) => {
  addLogs('config_twitchImport', channelName);

  return twitchImport(channelName);
});

async function twitchImport(channelName: string): Promise<boolean> {
  let channels: Channel[] = [];

  try {
    await Promise.all(
      REGISTERED_SERVICES.map(async (service) => {
        if (service.name === ServiceNamesEnum.TWITCH) {
          channels = await service.doImport([channelName], true);
        }
      }),
    );

    dialog.showMessageBox({
      type: 'info',
      message: `Import done ${channels.length} channels added.`,
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
  addLogs('channel_import_init');

  await Promise.all(
    REGISTERED_SERVICES.map(async (service) => {
      await service.doImportSettings(false);
    }),
  );

  addLogs('channel_check_init_done');

  (async (): Promise<void> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(10 * 60 * 1000);

      addLogs('channel_import_loop');

      await Promise.all(
        REGISTERED_SERVICES.map(async (service) => {
          addLogs('channel_import_loop_service', service.name);

          await service.doImportSettings(true);
        }),
      );
    }
  })();
}
