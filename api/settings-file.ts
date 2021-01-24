import { app, BrowserWindow, ipcMain, shell, clipboard } from 'electron';
import * as _ from 'lodash';

import { Config } from './config-class';
import { Channel } from './channel-class';

export const config = new Config();

ipcMain.on('config_changeSetting', (event, settingName, settingValue) => {
  if (settingName === 'twitchImport') {
    settingValue = _.uniq(settingValue);
  }

  return config.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_add', (event, channelLink) => {
  return config.addChannelLink(channelLink);
});

ipcMain.on('channel_remove', (event, id) => {
  return config.removeChannelById(id);
});

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  if (settingName === 'visibleName') {
    if (!settingValue) {
      settingValue = channel.name;
    }
  }

  channel.changeSetting(settingName, settingValue);

  return;
});

ipcMain.on(
  'channel_changeSettingSync',
  (event, id, settingName, settingValue) => {
    const channel = config.findById(id);

    if (!channel) {
      return (event.returnValue = false);
    }

    if (settingName === 'visibleName') {
      if (!settingValue) {
        settingValue = channel.name;
      }
    }

    event.returnValue = channel.changeSetting(settingName, settingValue);

    return;
  },
);

ipcMain.on('channel_openPage', (event, id) => {
  const channel = config.findById(id);

  if (channel === null) {
    return false;
  }

  const embedLink = channel.embedLink();

  if (embedLink) {
    shell.openExternal(embedLink);
  }

  return true;
});

ipcMain.on('channel_openChat', (event, id) => {
  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  let window: BrowserWindow;

  const chatLink = channel.chatLink();

  if (chatLink) {
    if (config.settings.playInWindow) {
      window = new BrowserWindow({
        width: 405,
        height: 720,
        webPreferences: {
          nodeIntegration: false,
        },
      });

      window.loadURL(chatLink);

      window.on('closed', () => {
        window = null;
      });

      app['mainWindow'].on('closed', () => {
        if (window) {
          window.close();
        }
      });
    } else {
      shell.openExternal(chatLink);
    }
  }

  return true;
});

ipcMain.on('channel_copyClipboard', (event, channelLink) => {
  clipboard.writeText(channelLink);

  return true;
});

ipcMain.once('getChannels', (event) => (event.returnValue = config.channels));

ipcMain.once('getSettings', (event) => (event.returnValue = config.settings));

ipcMain.on('getSettingSync', (event, settingName) => {
  if (!config.settings.hasOwnProperty(settingName)) {
    return (event.returnValue = null);
  }

  return (event.returnValue = config.settings[settingName]);
});

ipcMain.on('config_find', (event, query) => {
  const find = config.find(query);

  const res = {
    channels: _.map(find.channels, (channel: Channel) => {
      return channel.filterData();
    }),
    count: find.count,
  };

  event.returnValue = res;

  return;
});
