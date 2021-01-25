import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';

import { sleep } from './channel-check';
import { Channel } from './channel-class';
import { REGISTERED_SERVICES } from './globals';
import { ServiceNamesEnum } from './stream-services/_base';

ipcMain.on('config_twitchImport', (event, channelName) => {
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
  await Promise.all(
    REGISTERED_SERVICES.map(async (service) => {
      await service.doImportSettings(false);
    }),
  );

  (async (): Promise<void> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(10 * 60 * 1000);

      await Promise.all(
        REGISTERED_SERVICES.map(async (service) => {
          await service.doImportSettings(true);
        }),
      );
    }
  })();
}
