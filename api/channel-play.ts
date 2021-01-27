import { app, ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';

import { config } from './settings-file';
import { Config } from './config-class';
import { printNotification } from './notifications';
import { Channel } from './channel-class';
import { addLogs } from './logs';
import { ServiceNamesEnum } from './stream-services/_base';

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
      channel._playingProcesses > 0 &&
      settingName === 'autoRestart' &&
      settingValue
    ) {
      channel.changeSettings({
        onAutoRestart: true,
      });
    }
  },
);

export async function launchPlayerLink(
  channelLink: string,
  LQ = null,
): Promise<boolean> {
  const channel = Config.buildChannel(channelLink);

  if (!channel) {
    return false;
  }

  await launchPlayerChannel(channel, LQ);

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

export function launchPlayerChannel(
  channel: Channel,
  altQuality = false,
  autoRestart: boolean = null,
) {
  const LQ = !altQuality ? config.settings.LQ : !config.settings.LQ;

  channel.changeSettings({
    onAutoRestart: autoRestart !== null ? autoRestart : channel.autoRestart,
  });

  const { playLink, params } = !LQ ? channel.play() : channel.playLQ();

  return launchStreamlink(playLink, params, channel);
}

async function launchStreamlink(
  playLink: string,
  params: string[],
  channel: Channel,
) {
  addLogs(playLink, params);

  let firstStart = true;
  let autoRestartAttempts = 0;
  let startTime = Date.now();

  channel._playingProcesses++;

  console.log(channel.isLive, channel.onAutoRestart);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    addLogs(
      'streamlink_starting',
      firstStart,
      autoRestartAttempts,
      channel._playingProcesses,
    );

    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          'streamlink',
          [playLink, 'best', ...params],
          (error, stdout, stderr) => {
            console.log('error', error);
            console.log('stderr', stderr);
            console.log('stdout', stdout);

            if (error) {
              reject([error, stdout, stderr]);

              return;
            }

            resolve();
          },
        );
      });

      addLogs('streamlink_exited');

      if (Date.now() - startTime < AUTO_RESTART_TIMEOUT * 1000) {
        autoRestartAttempts++;
      } else {
        autoRestartAttempts = 0;
      }

      firstStart = false;
      startTime = Date.now();
    } catch (exception) {
      const [error, stdout, _stderr] = exception;

      addLogs('streamlink_error', error);

      if ((error as any).code === 'ENOENT') {
        await dialog.showMessageBox({
          type: 'error',
          message: 'Streamlink not found.',
        });

        await shell.openExternal(
          `https://github.com/streamlink/streamlink/releases`,
        );

        break;
      }

      if (firstStart) {
        printNotification('Error', error.message);

        if (stdout.indexOf('error: ') >= 0) {
          const [, message] = stdout.split('error: ');

          printNotification('Error', message);
        }
      }
    }

    if (channel.serviceName !== ServiceNamesEnum.CUSTOM && !channel.isLive) {
      break;
    }

    if (!channel.onAutoRestart) {
      break;
    }

    if (autoRestartAttempts > AUTO_RESTART_ATTEMPTS) {
      break;
    }
  }

  addLogs('playing_closing', channel._playingProcesses);

  channel._playingProcesses--;

  channel.changeSettings({
    onAutoRestart: false,
  });

  return;
}
