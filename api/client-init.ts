import { checkLoop as channelCheckLoop } from './channel-check';
import { checkLoop as infoCheckLoop } from './channel-info';
import { importLoop } from './Import';
import { checkLoop as versionCheckLoop } from './version-check';

export async function init() {
  await importLoop();
  await channelCheckLoop();
  await infoCheckLoop();
  await versionCheckLoop();
}
