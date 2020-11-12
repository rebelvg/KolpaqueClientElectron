import { loop as channelLoop } from './channel-check';
import { loop as infoLoop } from './channel-info';
import { loop as importLoop } from './Import';
import { loop as versionLoop } from './version-check';

export async function init() {
  await importLoop();
  await channelLoop();
  await infoLoop();
  await versionLoop();
}
