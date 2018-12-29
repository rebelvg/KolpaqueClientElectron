import { ipcMain, dialog } from 'electron';
const axios = require('axios');
const _ = require('lodash');
const { URL } = require('url');

import { config } from './SettingsFile';
const { twitchApiKey } = require('./Globals');

ipcMain.on('config_twitchImport', async (event, channelName) => {
  return await twitchImport(channelName);
});

ipcMain.once('client_ready', importLoop);

function twitchImportChannels(channels, i) {
  channels.forEach(function(channel) {
    let channelObj = config.addChannelLink(channel.channel.url);

    if (channelObj !== false) i++;
  });

  return i;
}

async function getTwitchData(url) {
  const { data } = await axios.get(url, { headers: { 'Client-ID': twitchApiKey } });

  return data;
}

async function twitchImportBase(channelName) {
  channelName = channelName.trim();

  if (channelName.length === 0) return null;

  try {
    let i = 0;

    const apiUrl = new URL(`https://api.twitch.tv/kraken/users/${channelName}/follows/channels`);

    apiUrl.searchParams.set('sortby', 'created_at');
    apiUrl.searchParams.set('direction', 'ASC');
    apiUrl.searchParams.set('limit', '100');

    let body = await getTwitchData(apiUrl.href);
    let channels = body.follows;

    if (!channels || channels.length === 0) return 0;

    config.addChannelLink(`http://www.twitch.tv/${channelName}`);

    i = twitchImportChannels(channels, i);

    while (channels.length !== 0) {
      body = await getTwitchData(body._links.next);
      channels = body.follows;

      i = twitchImportChannels(channels, i);
    }

    return i;
  } catch (e) {
    console.error(e.message);

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
  _.forEach(config.settings.twitchImport, async function(channelName) {
    await twitchImportBase(channelName);
  });
}

function importLoop() {
  autoKlpqImport();
  autoTwitchImport();

  setInterval(autoKlpqImport, 10 * 60 * 1000);
  setInterval(autoTwitchImport, 10 * 60 * 1000);
}
