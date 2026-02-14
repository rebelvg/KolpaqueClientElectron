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
import { logger } from './logs';
import { SourcesEnum } from './enums';

export const config = new Config();

const isTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent) =>
  main.mainWindow ? event.sender === main.mainWindow.webContents : false;

ipcMain.on('config_changeSetting_app', (event, settingName, settingValue) => {
  logger('info', 'config_changeSetting_app', settingName, settingValue);

  if (!isTrustedSender(event)) {
    logger('warn', 'config_changeSetting_app_blocked');

    return;
  }

  if (settingName === 'twitchImport') {
    settingValue = _.uniq(settingValue);
  }

  return config.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_add', async (event, url) => {
  logger('info', 'channel_add', url);

  if (!isTrustedSender(event)) {
    logger('warn', 'channel_add_blocked');

    return;
  }

  const channel = config.addChannelByUrl(url, SourcesEnum.MANUAL_ACTION);

  if (!channel) {
    return;
  }

  await config.runChannelUpdates(channel.service, [channel], 'channel_add');

  return channel;
});

ipcMain.on('channel_remove', (event, id) => {
  logger('info', 'channel_remove', id);

  if (!isTrustedSender(event)) {
    logger('warn', 'channel_remove_blocked');

    return;
  }

  return config.removeChannelById(id);
});

ipcMain.on(
  'channel_changeSetting_app',
  (event, id, settingName, settingValue) => {
    logger('info', 'channel_changeSetting_app', id, settingName, settingValue);

    if (!isTrustedSender(event)) {
      logger('warn', 'channel_changeSetting_app_blocked');

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
      if (channel._playingProcesses.length > 0 && settingValue) {
        newSettings['onAutoRestart'] = true;
      }
    }

    channel.changeSettings(newSettings);

    return;
  },
);

ipcMain.on('channel_openPage', (event, id) => {
  logger('info', 'channel_openPage', id);

  if (!isTrustedSender(event)) {
    logger('warn', 'channel_openPage_blocked');

    return false;
  }

  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  const embedUrl = channel.embedUrl();

  if (embedUrl) {
    shell.openExternal(embedUrl);
  }

  return true;
});

ipcMain.on('channel_openChat', async (event, id) => {
  logger('info', 'channel_openChat', id);

  if (!isTrustedSender(event)) {
    logger('warn', 'channel_openChat_blocked');

    return false;
  }

  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  const chatUrl = channel.chatUrl();

  if (!chatUrl) {
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
      await window.loadURL(chatUrl);
    } catch (error) {
      logger('warn', error, chatUrl);

      window.close();

      return false;
    }
  } else {
    shell.openExternal(chatUrl);
  }

  return true;
});

ipcMain.on('channel_copyClipboard', (event, url) => {
  logger('info', 'channel_copyClipboard', url);

  if (!isTrustedSender(event)) {
    logger('warn', 'channel_copyClipboard_blocked');

    return false;
  }

  clipboard.writeText(url);

  return true;
});

ipcMain.on('getSettings', (event) => {
  if (!isTrustedSender(event)) {
    logger('warn', 'getSettings_blocked');

    return;
  }

  event.returnValue = config.settings;
});

ipcMain.handle('config_find', (event, query) => {
  logger('info', 'config_find', query);

  if (!isTrustedSender(event)) {
    logger('warn', 'config_find_blocked');

    return { channels: [], count: { online: 0, offline: 0 } };
  }

  const { channels, count } = config.find(query);

  return {
    channels: channels.map(
      ({
        id,
        url,
        service,
        visibleName,
        isPinned,
        autoStart,
        autoRestart,
        onAutoRestart,
        _iconUrl,
        isLive,
      }) => ({
        id,
        url,
        serviceName: service.name,
        visibleName,
        isPinned,
        autoStart,
        autoRestart,
        onAutoRestart,
        _iconUrl,
        isLive,
      }),
    ),
    count: count,
  };
});
