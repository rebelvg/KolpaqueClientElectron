import { loop as channelLoop } from './channel-check';
import { loop as infoLoop } from './channel-info';
import { loop as importLoop } from './channel-import';
import { loop as versionLoop } from './version-check';
import { run as runLogs } from './logs';
import { run as runSocket } from './socket-client';

export async function init(): Promise<void> {
  await importLoop();
  await channelLoop();
  await infoLoop();
  await versionLoop();

  runLogs();
  runSocket();
}
