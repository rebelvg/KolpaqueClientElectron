import { checkLoop as channelCheckLoop } from './ChannelCheck';
import { checkLoop as infoCheckLoop } from './ChannelInfo';
import { importLoop } from './Import';
import { checkLoop as versionCheckLoop } from './VersionCheck';

export async function init() {
  await importLoop();
  await channelCheckLoop();
  await infoCheckLoop();
  await versionCheckLoop();
}
