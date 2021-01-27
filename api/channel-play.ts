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

ipcMain.on(
  'channel_play',
  async (event, id, altQuality = false, autoRestart = null) => {
    const channel = config.findById(id);

    if (!channel) {
      return false;
    }

    await channel.startPlaying(altQuality, autoRestart);
  },
);

ipcMain.on(
  'channel_changeSettingSync',
  (event, id, settingName, settingValue) => {
    const channel = config.findById(id);

    if (!channel) {
      return false;
    }

    if (
      channel._processes.length > 0 &&
      settingName === 'autoRestart' &&
      settingValue
    ) {
      channel.changeSettings({
        onAutoRestart: true,
      });
    }
  },
);

export function launchPlayerLink(channelLink: string, LQ = null): boolean {
  const channel = Config.buildChannel(channelLink);

  if (!channel) {
    return false;
  }

  launchPlayerObj(channel, LQ);

  return true;
}

export async function playInWindow(channel: Channel): Promise<boolean> {
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

export function launchPlayerObj(
  channel: Channel,
  altQuality = false,
  autoRestart: boolean = null,
): ChildProcess {
  const LQ = !altQuality ? config.settings.LQ : !config.settings.LQ;

  if (autoRestart === null) {
    channel.changeSettings({
      onAutoRestart: channel.autoRestart,
    });
  } else {
    channel.changeSettings({
      onAutoRestart: autoRestart,
    });
  }

  const { playLink, params } = !LQ ? channel.play() : channel.playLQ();

  return launchStreamlink(playLink, params, channel);
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

          channel.changeSettings({
            onAutoRestart: false,
          });

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
        channel.changeSettings({
          onAutoRestart: false,
        });

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
