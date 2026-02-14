import { init as checkInit } from './channel-check';
import { init as infoInit } from './channel-info';
import { init as importInit } from './channel-import';
import { init as versionInit } from './version-check';
import { init as logsInit, logger } from './logs';
import { init as socketInit } from './socket-client';
import { init as clientsInit } from './api-clients';

export async function init(): Promise<void> {
  logger('info', 'init_start');

  logsInit();

  socketInit();

  await clientsInit();

  await checkInit();
  await importInit();
  await versionInit();

  await infoInit();

  logger('info', 'init_done');
}
