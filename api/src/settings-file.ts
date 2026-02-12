import {
  BrowserWindow,
  ipcMain,
  shell,
  clipboard,
  IpcMainEvent,
  IpcMainInvokeEvent,
} from 'electron';
import * as _ from 'lodash';

import { Config } from './config-class';
import { Channel } from './channel-class';
import { main } from './main';
import { addLogs } from './logs';
import { SourcesEnum } from './enums';

export const config = new Config();

const isTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent) =>
  main.mainWindow ? event.sender === main.mainWindow.webContents : false;

ipcMain.on('config_changeSetting', (event, settingName, settingValue) => {
  addLogs('info', 'config_changeSetting', settingName, settingValue);

  if (!isTrustedSender(event)) {
    addLogs('warn', 'config_changeSetting_blocked');

    return;
  }

  if (settingName === 'twitchImport') {
    settingValue = _.uniq(settingValue);
  }

  return config.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_add', async (event, channelLink) => {
  addLogs('info', 'channel_add', channelLink);

  if (!isTrustedSender(event)) {
    addLogs('warn', 'channel_add_blocked');

    return;
  }

  const channel = config.addChannelLink(channelLink, SourcesEnum.MANUAL_ACTION);

  if (!channel) {
    return;
  }

  await config.runChannelUpdates([channel], true, 'channel_add');

  return channel;
});

ipcMain.on('channel_remove', (event, id) => {
  addLogs('info', 'channel_remove', id);

  if (!isTrustedSender(event)) {
    addLogs('warn', 'channel_remove_blocked');

    return;
  }

  return config.removeChannelById(id);
});

ipcMain.on(
  'channel_changeSettingSync',
  (event, id, settingName, settingValue) => {
    addLogs('info', 'channel_changeSettingSync', id, settingName, settingValue);

    if (!isTrustedSender(event)) {
      addLogs('warn', 'channel_changeSettingSync_blocked');

      return;
    }

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

  if (!isTrustedSender(event)) {
    addLogs('warn', 'channel_openPage_blocked');

    return false;
  }

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

ipcMain.on('channel_openChat', async (event, id) => {
  addLogs('info', 'channel_openChat', id);

  if (!isTrustedSender(event)) {
    addLogs('warn', 'channel_openChat_blocked');

    return false;
  }

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
      width: 640,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        partition: 'nopersist',
      },
      autoHideMenuBar: true,
    });

    main.mainWindow!.on('closed', () => {
      if (window && !window.isDestroyed()) {
        window.close();
      }
    });

    window.setMenu(null);

    try {
      await window.loadURL(chatLink);
    } catch (error) {
      addLogs('warn', error, chatLink);

      window.close();

      return false;
    }
  } else {
    shell.openExternal(chatLink);
  }

  return true;
});

ipcMain.on('channel_copyClipboard', (event, channelLink) => {
  addLogs('info', 'channel_copyClipboard', channelLink);

  if (!isTrustedSender(event)) {
    addLogs('warn', 'channel_copyClipboard_blocked');

    return false;
  }

  clipboard.writeText(channelLink);

  return true;
});

ipcMain.on('getSettings', (event) => {
  if (!isTrustedSender(event)) {
    addLogs('warn', 'getSettings_blocked');

    return;
  }

  event.returnValue = config.settings;
});

ipcMain.handle('config_find', (event, query) => {
  addLogs('info', 'config_find', query);

  if (!isTrustedSender(event)) {
    addLogs('warn', 'config_find_blocked');

    return { channels: [], count: { online: 0, offline: 0 } };
  }

  const find = config.find(query);

  return {
    channels: _.map(find.channels, (channel: Channel) => {
      return channel.filterData();
    }),
    count: find.count,
  };
});
