import { importLoop } from './Import';
import { checkLoop as infoCheckLoop } from './ChannelInfo';
import { checkLoop as channelCheckLoop } from './ChannelCheck';
import { checkLoop as versionCheckLoop } from './VersionCheck';

export async function init() {
  await importLoop();
  await infoCheckLoop();
  await channelCheckLoop();
  await versionCheckLoop();
}
