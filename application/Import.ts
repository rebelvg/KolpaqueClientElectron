import { ipcMain, dialog } from 'electron';
import axios from 'axios';
import * as _ from 'lodash';
import { URL } from 'url';

import { config } from './SettingsFile';
import { twitchApiKey } from './Globals';
import { addLogs } from './Logs';

ipcMain.on('config_twitchImport', async (event, channelName) => {
  return await twitchImport(channelName);
});

ipcMain.once('client_ready', importLoop);

async function twitchImportChannels(channels: any[], i: number) {
  const { data: userData } = await axios.get(
    `https://api.twitch.tv/helix/users?${channels.map(channel => `id=${channel.to_id}`).join('&')}`,
    {
      headers: { 'Client-ID': twitchApiKey }
    }
  );

  for (const channel of userData.data) {
    let channelObj = config.addChannelLink(`https://twitch.tv/${channel.login}`);

    if (channelObj !== false) i++;
  }

  return i;
}

async function getTwitchData(url: URL) {
  const { data } = await axios.get(url.href, { headers: { 'Client-ID': twitchApiKey } });

  return data;
}

async function twitchImportBase(channelName) {
  channelName = channelName.trim();

  if (channelName.length === 0) return null;

  const { data: userData } = await axios.get(`https://api.twitch.tv/helix/users?login=${channelName}`, {
    headers: { 'Client-ID': twitchApiKey }
  });

  if (!_.get(userData, 'data.0.id')) {
    return;
  }

  const userId = _.get(userData, 'data.0.id');

  try {
    let i = 0;

    const apiUrl = new URL(`https://api.twitch.tv/helix/users/follows?from_id=${userId}`);

    apiUrl.searchParams.set('first', '100');

    let followersData = await getTwitchData(apiUrl);
    let channels = followersData.data;

    if (!channels || channels.length === 0) return i;

    config.addChannelLink(`http://www.twitch.tv/${channelName}`);

    i = await twitchImportChannels(channels, i);

    while (channels.length !== 0) {
      apiUrl.searchParams.set('after', followersData.pagination.cursor);

      followersData = await getTwitchData(apiUrl);
      channels = followersData.data;

      if (!channels || channels.length === 0) return i;

      i = await twitchImportChannels(channels, i);
    }

    return i;
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

async function autoKlpqImport() {
  const url = `http://stats.klpq.men/export/channels.json`;

  const { data } = await axios.get(url);

  _.forEach(data, channelUrl => {
    config.addChannelLink(channelUrl);
  });
}

function autoTwitchImport() {
  _.forEach(config.settings.twitchImport, async channelName => {
    await twitchImportBase(channelName);
  });
}

function importLoop() {
  autoKlpqImport();
  autoTwitchImport();

  setInterval(autoKlpqImport, 10 * 60 * 1000);
  setInterval(autoTwitchImport, 10 * 60 * 1000);
}