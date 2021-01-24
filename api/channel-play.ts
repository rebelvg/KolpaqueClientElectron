import { app, ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { execFile, ChildProcess } from 'child_process';
import * as _ from 'lodash';

import { config } from './settings-file';
import { Config } from './config-class';
import { printNotification } from './notifications';
import { Channel } from './channel-class';
import { addLogs } from './logs';

const AUTO_RESTART_ATTEMPTS = 3;
const AUTO_RESTART_TIMEOUT = 60;

function setChannelEvents(channel: Channel): void {
  channel.on('setting_changed', (settingName, settingValue) => {
    if (settingName === 'isLive' && !settingValue) {
      _.forEach(channel._windows, (window: BrowserWindow) => window.close());

      channel._windows = [];
    }
  });

  channel.on('play', async (altQuality = false, autoRestart = null) => {
    if (config.settings.playInWindow) {
      if (!(await playInWindow(channel))) {
        launchPlayerObj(channel, altQuality, autoRestart);
      }
    } else {
      launchPlayerObj(channel, altQuality, autoRestart);
    }
  });
}

ipcMain.on(
  'channel_play',
  (event, id, altQuality = false, autoRestart = null) => {
    const channel = config.findById(id);

    if (!channel) {
      return false;
    }

    channel.emit('play', altQuality, autoRestart);
  },
);

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
  const channel = config.findById(id);

  if (!channel) {
    return false;
  }

  if (
    channel._processes.length > 0 &&
    settingName === 'autoRestart' &&
    settingValue
  ) {
    channel.changeSetting('onAutoRestart', true);
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
  const channel = Config.buildChannel(channelLink);

  if (!channel) {
    return false;
  }

  launchPlayerObj(channel, LQ);

  return true;
}

async function playInWindow(channel: Channel): Promise<boolean> {
  let window: BrowserWindow;

  const embedLink = channel.embedLink();

  if (embedLink) {
    window = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
      },
    });

    await window.loadURL(embedLink);

    window.on('closed', () => {
      _.pull(channel._windows, window);

      window = null;
    });

    app['mainWindow'].on('closed', () => {
      if (window) {
        window.close();
      }
    });

    channel._windows.push(window);
  }

  return !!window;
}

function launchPlayerObj(
  channel: Channel,
  altQuality = false,
  autoRestart: boolean = null,
): void {
  const LQ = !altQuality ? config.settings.LQ : !config.settings.LQ;

  if (autoRestart === null) {
    channel.changeSetting('onAutoRestart', channel.autoRestart);
  } else {
    channel.changeSetting('onAutoRestart', autoRestart);
  }

  const { playLink, params } = !LQ ? channel.play() : channel.playLQ();

  launchStreamlink(playLink, params, channel);
}

function launchStreamlink(
  playLink: string,
  params: string[],
  channel: Channel,
  firstStart = true,
): ChildProcess {
  addLogs(playLink, params);

  channel._startTime = Date.now();

  const childProcess = execFile(
    'streamlink',
    [playLink, 'best', ...params],
    (err, data) => {
      addLogs(err, data, 'streamlink exited.');

      if (err) {
        if ((err as any).code === 'ENOENT') {
          dialog.showMessageBox({
            type: 'error',
            message: 'Streamlink not found.',
          });

          channel.changeSetting('onAutoRestart', false);

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

      if (Date.now() - channel._startTime < AUTO_RESTART_TIMEOUT * 1000) {
        channel._autoRestartAttempts++;
      } else {
        channel._autoRestartAttempts = 0;
      }

      if (
        channel.isLive &&
        channel.onAutoRestart &&
        channel._autoRestartAttempts < AUTO_RESTART_ATTEMPTS
      ) {
        launchStreamlink(playLink, params, channel, false);
      } else {
        channel.changeSetting('onAutoRestart', false);

        channel._autoRestartAttempts = 0;
      }
    },
  );

  channel._processes.push(childProcess);

  childProcess.on('error', () => {
    _.pull(channel._processes, childProcess);
  });

  childProcess.on('exit', () => {
    _.pull(channel._processes, childProcess);
  });

  return childProcess;
}
