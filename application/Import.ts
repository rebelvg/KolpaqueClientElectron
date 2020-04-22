import { ipcMain, dialog } from 'electron';
import axios from 'axios';
import * as _ from 'lodash';
import { URL } from 'url';

import { config } from './SettingsFile';
import { twitchApiKey } from './Globals';
import { addLogs } from './Logs';
import { Channel } from './ChannelClass';

ipcMain.on('config_twitchImport', async (event, channelName) => {
  return await twitchImport(channelName);
});

ipcMain.once('client_ready', importLoop);

async function twitchImportChannels(
  channels: any[]
): Promise<{
  channelsAdded: Channel[];
}> {
  const channelsAdded = [];

  const { data: userData } = await axios.get(
    `https://api.twitch.tv/helix/users?${channels.map(channel => `id=${channel.to_id}`).join('&')}`,
    {
      headers: { 'Client-ID': twitchApiKey }
    }
  );

  for (const channel of userData.data) {
    let channelObj = config.addChannelLink(`https://twitch.tv/${channel.login}`);

    if (channelObj) {
      channelsAdded.push(channelObj);
    }
  }

  return {
    channelsAdded
  };
}

async function getTwitchData(url: URL) {
  const { data } = await axios.get(url.href, { headers: { 'Client-ID': twitchApiKey } });

  return data;
}

async function twitchImportBase(channelName: string): Promise<number> {
  channelName = channelName.trim();

  if (channelName.length === 0) return null;

  const { data: userData } = await axios.get(`https://api.twitch.tv/helix/users?login=${channelName}`, {
    headers: { 'Client-ID': twitchApiKey }
  });

  if (!_.get(userData, 'data.0.id')) {
    return;
  }

  const userId = _.get(userData, 'data.0.id');

  const addedChannels: Channel[] = [];

  try {
    const apiUrl = new URL(`https://api.twitch.tv/helix/users/follows?from_id=${userId}`);

    apiUrl.searchParams.set('first', '100');

    let followersData = await getTwitchData(apiUrl);
    let channels = followersData.data;

    if (!channels || channels.length === 0) return 0;

    const addedChannel = config.addChannelLink(`http://www.twitch.tv/${channelName}`);

    if (addedChannel) {
      addedChannels.push(addedChannel);
    }

    const { channelsAdded } = await twitchImportChannels(channels);

    channelsAdded.forEach(channelObj => addedChannels.push(channelObj));

    while (channels.length !== 0) {
      apiUrl.searchParams.set('after', followersData.pagination.cursor);

      followersData = await getTwitchData(apiUrl);
      channels = followersData.data;

      if (!channels || channels.length === 0) {
        break;
      }

      const { channelsAdded } = await twitchImportChannels(channels);

      channelsAdded.forEach(channelObj => addedChannels.push(channelObj));
    }

    config.emit('channel_added_channels', addedChannels);

    return addedChannels.length;
  } catch (e) {
    addLogs(e);

    return null;
  }
}

async function twitchImport(channelName) {
  let res = await twitchImportBase(channelName);

  if (res !== null) {
    dialog.showMessageBox({
      type: 'info',
      message: 'Import done. ' + res + ' channels added.'
    });

    return true;
  } else {
    dialog.showMessageBox({
      type: 'error',
      message: 'Import error.'
    });

    return false;
  }
}

function autoTwitchImport() {
  _.forEach(config.settings.twitchImport, async channelName => {
    await twitchImportBase(channelName);
  });
}

function importLoop() {
  autoTwitchImport();

  setInterval(autoTwitchImport, 10 * 60 * 1000);
}
