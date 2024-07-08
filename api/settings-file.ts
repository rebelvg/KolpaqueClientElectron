import { BrowserWindow, ipcMain, shell, clipboard } from 'electron';
import * as _ from 'lodash';

import { Config } from './config-class';
import { Channel } from './channel-class';
import { main } from './main';
import { addLogs } from './logs';
import { SourcesEnum } from './enums';

export const config = new Config();

ipcMain.on('config_changeSetting', (event, settingName, settingValue) => {
  addLogs('info', 'config_changeSetting', settingName, settingValue);

  if (settingName === 'twitchImport') {
    settingValue = _.uniq(settingValue);
  }

  return config.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_add', async (event, channelLink) => {
  addLogs('info', 'channel_add', channelLink);

  const channel = config.addChannelLink(channelLink, SourcesEnum.MANUAL_ACTION);

  if (!channel) {
    return;
  }

  await config.runChannelUpdates([channel], false);

  return channel;
});

ipcMain.on('channel_remove', (event, id) => {
  addLogs('info', 'channel_remove', id);

  return config.removeChannelById(id);
});

ipcMain.on(
  'channel_changeSettingSync',
  (event, id, settingName, settingValue) => {
    addLogs('info', 'channel_changeSettingSync', id, settingName, settingValue);

    const channel = config.findById(id);

    if (!channel) {
      return;
    }

    const newSettings = {
      [settingName]: settingValue,
    };

    if (settingName === 'autoRestart') {
      if (channel._playingProcesses > 0 && settingValue) {
        newSettings['onAutoRestart'] = true;
      }
    }

    channel.changeSettings(newSettings);

    return;
  },
);

ipcMain.on('channel_openPage', (event, id) => {
  addLogs('info', 'channel_openPage', id);

  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  const embedLink = channel.embedLink();

  if (embedLink) {
    shell.openExternal(embedLink);
  }

  return true;
});

ipcMain.on('channel_openChat', (event, id) => {
  addLogs('info', 'channel_openChat', id);

  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  const chatLink = channel.chatLink();

  if (!chatLink) {
    return false;
  }

  if (config.settings.playInWindow) {
    const window = new BrowserWindow({
      width: 405,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
      },
    });

    window.loadURL(chatLink);

    main.mainWindow!.on('closed', () => {
      if (window) {
        window.close();
      }
    });
  } else {
    shell.openExternal(chatLink);
  }

  return true;
});

ipcMain.on('channel_copyClipboard', (event, channelLink) => {
  addLogs('info', 'channel_copyClipboard', channelLink);

  clipboard.writeText(channelLink);

  return true;
});

ipcMain.on('getSettings', (event) => (event.returnValue = config.settings));

ipcMain.handle('config_find', (event, query) => {
  addLogs('info', 'config_find', query);

  const find = config.find(query);

  return {
    channels: _.map(find.channels, (channel: Channel) => {
      return channel.filterData();
    }),
    count: find.count,
  };
});
