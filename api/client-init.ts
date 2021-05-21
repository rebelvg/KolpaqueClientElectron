import { loop as channelLoop } from './channel-check';
import { loop as infoLoop } from './channel-info';
import { loop as importLoop } from './channel-import';
import { loop as versionLoop } from './version-check';
import { addLogs, run as runLogs } from './logs';
import { run as runSocket } from './socket-client';
import { syncSettings } from './sync-settings';
import { main } from './main';

export async function init(): Promise<void> {
  addLogs('init_start');

  runLogs();

  runSocket();

  await importLoop();
  await channelLoop();
  await infoLoop();
  await versionLoop();

  await syncSettings.init();

  main.mainWindow.webContents.send('backend_ready');

  addLogs('init_done');
}
