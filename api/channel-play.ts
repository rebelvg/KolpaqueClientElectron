import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';

import { config } from './settings-file';
import { Config } from './config-class';
import { printNotification } from './notifications';
import { Channel } from './channel-class';
import { addLogs } from './logs';
import { ProtocolsEnum, ServiceNamesEnum } from './stream-services/_base';
import { main } from './main';

const AUTO_RESTART_ATTEMPTS = 3;
const AUTO_RESTART_TIMEOUT = 60;

ipcMain.on(
  'channel_play',
  async (event, id, altQuality = false, autoRestart = null) => {
    addLogs('channel_play', id, altQuality, autoRestart);

    const channel = config.findById(id);

    if (!channel) {
      return false;
    }

    await channel.startPlaying(altQuality, autoRestart);
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
  const embedLink = channel.embedLink();

  if (!embedLink) {
    return false;
  }

  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  await window.loadURL(embedLink);

  window.on('closed', () => {
    _.pull(channel._windows, window);
  });

  main.mainWindow.on('closed', () => {
    if (window && !window.isDestroyed) {
      window.close();
    }
  });

  channel._windows.push(window);

  return !!window;
}

export async function launchPlayerChannel(
  channel: Channel,
  altQuality = false,
  autoRestart: boolean = null,
) {
  const LQ = !altQuality ? config.settings.LQ : !config.settings.LQ;

  channel.changeSettings({
    onAutoRestart: autoRestart !== null ? autoRestart : channel.autoRestart,
  });

  const { playLink, params } = !LQ
    ? await channel.play()
    : await channel.playLQ();

  return launchStreamlink(playLink, params, channel);
}

async function launchStreamlink(
  playLink: string,
  params: string[],
  channel: Channel,
) {
  addLogs(playLink, params, channel.link);

  let firstStart = true;
  let autoRestartAttempts = 0;
  let startTime = Date.now();

  channel._playingProcesses++;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    addLogs(
      'streamlink_starting',
      channel.link,
      firstStart,
      autoRestartAttempts,
      channel._playingProcesses,
    );

    try {
      if (
        playLink.includes(ProtocolsEnum.RTMP) &&
        config.settings.customRtmpClientCommand.includes('{{RTMP_URL}}')
      ) {
        const [
          command,
          ...commandArgs
        ] = config.settings.customRtmpClientCommand
          .replace('{{RTMP_URL}}', playLink)
          .split(' ');

        await new Promise<void>((resolve, reject) => {
          addLogs('channel_play_with_custom_command', command, commandArgs);

          execFile(command, commandArgs, (error, stdout, stderr) => {
            if (error) {
              reject([error, stdout, stderr]);

              return;
            }

            resolve();
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          addLogs('channel_play_with_streamlink');

          execFile(
            'streamlink',
            [playLink, 'best', ...params],
            (error, stdout, stderr) => {
              if (error) {
                reject([error, stdout, stderr]);

                return;
              }

              resolve();
            },
          );
        });
      }

      addLogs('streamlink_exited', channel.link);

      if (Date.now() - startTime < AUTO_RESTART_TIMEOUT * 1000) {
        autoRestartAttempts++;
      } else {
        autoRestartAttempts = 0;
      }

      firstStart = false;
      startTime = Date.now();
    } catch (exception) {
      const [error, stdout, _stderr] = exception;

      addLogs('streamlink_error', channel.link, error, stdout, _stderr);

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

        const [, message] = stdout.split('[cli][error]');

        if (message) {
          printNotification('Error', message?.trim());
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

  addLogs('playing_closing', channel.link, channel._playingProcesses);

  channel._playingProcesses--;

  channel.changeSettings({
    onAutoRestart: false,
  });

  return;
}
