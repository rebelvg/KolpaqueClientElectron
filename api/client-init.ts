import { loop as channelLoop } from './channel-check';
import { loop as infoLoop } from './channel-info';
import { loop as importLoop } from './channel-import';
import { loop as versionLoop } from './version-check';
import { addLogs, run as runLogs } from './logs';
import { run as runSocket } from './socket-client';
import { clientLoop } from './api-clients';

export async function init(): Promise<void> {
  addLogs('info', 'init_start');

  runLogs();

  runSocket();

  await importLoop();
  await channelLoop();
  await versionLoop();

  await infoLoop();

  await clientLoop();

  addLogs('info', 'init_done');
}
