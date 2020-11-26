import { app, ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { execFile, ChildProcess } from 'child_process';
import * as _ from 'lodash';

import { config } from './settings-file';
import { Config } from './config-class';
import { printNotification } from './Notifications';
import { Channel } from './channel-class';
import { addLogs } from './Logs';

const AUTO_RESTART_ATTEMPTS = 3;
const AUTO_RESTART_TIMEOUT = 60;

function setChannelEvents(channelObj: Channel): void {
  channelObj.on('setting_changed', (settingName, settingValue) => {
    if (settingName === 'isLive' && !settingValue) {
      _.forEach(channelObj._windows, (window: BrowserWindow) => window.close());

      channelObj._windows = [];
    }
  });

  channelObj.on('play', async (altQuality = false, autoRestart = null) => {
    if (config.settings.playInWindow) {
      if (!(await playInWindow(channelObj))) {
        launchPlayerObj(channelObj, altQuality, autoRestart);
      }
    } else {
      launchPlayerObj(channelObj, altQuality, autoRestart);
    }
  });
}

ipcMain.on(
  'channel_play',
  (event, id, altQuality = false, autoRestart = null) => {
    const channelObj = config.findById(id);

    if (!channelObj) {
      return false;
    }

    channelObj.emit('play', altQuality, autoRestart);
  },
);

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
  const channelObj = config.findById(id);

  if (!channelObj) {
    return false;
  }

  if (
    channelObj._processes.length > 0 &&
    settingName === 'autoRestart' &&
    settingValue
  ) {
    channelObj.changeSetting('onAutoRestart', true);
  }
});

_.forEach(config.channels, setChannelEvents);

config.on('channel_added', setChannelEvents);

config.on('channel_added_channels', (channels: Channel[]) => {
  channels.forEach((channel) => {
    setChannelEvents(channel);
  });
});

export function launchPlayerLink(channelLink: string, LQ = null): boolean {
  const channelObj = Config.buildChannelObj(channelLink);

  if (!channelObj) {
    return false;
  }

  launchPlayerObj(channelObj, LQ);

  return true;
}

async function playInWindow(channelObj: Channel): Promise<boolean> {
  let link: string;
  let window: BrowserWindow;

  if (channelObj.serviceObj.embed) {
    link = channelObj.serviceObj.embed(channelObj);
  } else {
    if (['http:', 'https:'].includes(channelObj.protocol)) {
      link = channelObj.link;
    }
  }

  if (link) {
    window = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
      },
    });

    await window.loadURL(link);

    window.on('closed', () => {
      _.pull(channelObj._windows, window);

      window = null;
    });

    app['mainWindow'].on('closed', () => {
      if (window) {
        window.close();
      }
    });

    channelObj._windows.push(window);
  }

  return !!window;
}

function launchPlayerObj(
  channelObj: Channel,
  altQuality = false,
  autoRestart: boolean = null,
): void {
  const LQ = !altQuality ? config.settings.LQ : !config.settings.LQ;

  if (autoRestart === null) {
    channelObj.changeSetting('onAutoRestart', channelObj.autoRestart);
  } else {
    channelObj.changeSetting('onAutoRestart', autoRestart);
  }

  let { playLink, params } = channelObj.getPlayLink();

  if (LQ) {
    const onLQ = channelObj.getLqParams(playLink, params);

    playLink = onLQ.playLink;
    params = onLQ.params;
  }

  launchStreamlink(playLink, params, channelObj);
}

function launchStreamlink(
  playLink,
  params,
  channelObj,
  firstStart = true,
): ChildProcess {
  addLogs(playLink, params);

  channelObj._startTime = Date.now();

  const childProcess = execFile(
    'streamlink',
    [playLink, 'best', ...params],
    (err, data) => {
      addLogs(err, data, 'streamlink exited.');

      if (err) {
        if (err.code === 'ENOENT') {
          dialog.showMessageBox({
            type: 'error',
            message: 'Streamlink not found.',
          });

          channelObj.changeSetting('onAutoRestart', false);

          return shell.openExternal(
            `https://github.com/streamlink/streamlink/releases`,
          );
        } else {
          if (firstStart) {
            printNotification('Error', err.message);
          }
        }
      }

      if (data.indexOf('error: ') >= 0) {
        const error = data.split('error: ');

        if (firstStart) {
          printNotification('Error', error[1]);
        }
      }

      if (Date.now() - channelObj._startTime < AUTO_RESTART_TIMEOUT * 1000) {
        channelObj._autoRestartAttempts++;
      } else {
        channelObj._autoRestartAttempts = 0;
      }

      if (
        channelObj.isLive &&
        channelObj.onAutoRestart &&
        channelObj._autoRestartAttempts < AUTO_RESTART_ATTEMPTS
      ) {
        launchStreamlink(playLink, params, channelObj, false);
      } else {
        channelObj.changeSetting('onAutoRestart', false);

        channelObj._autoRestartAttempts = 0;
      }
    },
  );

  channelObj._processes.push(childProcess);

  childProcess.on('error', () => {
    _.pull(channelObj._processes, childProcess);
  });

  childProcess.on('exit', () => {
    _.pull(channelObj._processes, childProcess);
  });

  return childProcess;
}
