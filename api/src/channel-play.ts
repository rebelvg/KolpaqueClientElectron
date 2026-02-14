import { ipcMain, dialog, shell, BrowserWindow, IpcMainEvent } from 'electron';
import { spawn } from 'child_process';
import * as _ from 'lodash';

import { config } from './settings-file';
import { Config } from './config-class';
import { printNotification } from './notifications';
import { Channel } from './channel-class';
import { logger } from './logs';
import { ProtocolsEnum, ServiceNamesEnum } from './stream-services/_base';
import { main } from './main';

const AUTO_RESTART_ATTEMPTS = 3;
const AUTO_RESTART_TIMEOUT = 60;

const isTrustedSender = (event: IpcMainEvent) =>
  main.mainWindow ? event.sender === main.mainWindow.webContents : false;

ipcMain.on(
  'channel_play',
  async (event, id, altQuality = false, autoRestart = null) => {
    if (!isTrustedSender(event)) {
      logger('warn', 'channel_play_blocked', id);

      return;
    }

    const channel = config.findById(id);

    logger('info', 'channel_play', channel?.url, altQuality, autoRestart);

    if (!channel) {
      return false;
    }

    await channel.startPlaying(altQuality, autoRestart);
  },
);

export async function launchPlayerUrl(
  url: string,
  LQ: boolean,
): Promise<boolean> {
  logger('info', 'launchPlayerUrl', {
    url,
    LQ,
  });

  const channel = Config.buildChannel(url);

  if (!channel) {
    return false;
  }

  await channel.startPlaying(LQ, false);

  return true;
}

export async function playInWindow(channel: Channel): Promise<boolean> {
  const embedUrl = channel.embedUrl();

  if (!embedUrl) {
    return false;
  }

  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition: 'nopersist',
    },
    autoHideMenuBar: true,
  });

  window.on('closed', () => {
    _.pull(channel._windows, window);
  });

  main.mainWindow!.on('closed', () => {
    if (window && !window.isDestroyed()) {
      window.close();
    }
  });

  window.setMenu(null);

  try {
    await window.loadURL(embedUrl);

    main.createdWindows.push(window);

    channel._windows.push(window);
  } catch (error) {
    logger('warn', error, embedUrl);

    window.close();

    return false;
  }

  return true;
}

export async function launchPlayerChannel(
  channel: Channel,
  altQuality: boolean | null,
  autoRestart: boolean | null,
) {
  const LQ = !altQuality ? config.settings.LQ : true;

  channel.changeSettings({
    onAutoRestart: autoRestart === null ? channel.autoRestart : autoRestart,
  });

  const { playUrl, params } = !LQ
    ? await channel.play()
    : await channel.playLQ();

  if (!playUrl) {
    return;
  }

  return launchStreamlink(playUrl, params, channel);
}

async function launchStreamlink(
  playUrl: string,
  params: string[],
  channel: Channel,
) {
  logger('info', playUrl, params, channel.url);

  let firstStart = true;
  let autoRestartAttempts = 0;
  let startTime = Date.now();

  channel._playingProcesses++;

  while (true) {
    logger(
      'info',
      'streamlink_starting',
      channel.url,
      firstStart,
      autoRestartAttempts,
      channel._playingProcesses,
    );

    try {
      const [command, ...commandArgs] =
        [ProtocolsEnum.RTMP, ProtocolsEnum.RTMPS].includes(channel.protocol) &&
        config.settings.customRtmpClientCommand.includes('{{RTMP_URL}}')
          ? config.settings.customRtmpClientCommand
              .replace('{{RTMP_URL}}', playUrl)
              .split(' ')
              .map((a) => a.trim())
          : ['streamlink', playUrl, 'best', ...params];

      await new Promise<void>((resolve, reject) => {
        logger('info', 'spawn_command', command, commandArgs);

        const pipeProcess = spawn(command!, commandArgs);

        let stdoutString = '';
        let stderrString = '';

        pipeProcess.stdout.on('data', (data: Buffer) => {
          if (command!.toLowerCase() === 'streamlink') {
            stdoutString += data.toString('utf-8');
          }
        });

        pipeProcess.stderr.on('data', (data: Buffer) => {
          stderrString += data.toString('utf-8');
        });

        pipeProcess.on('error', (error) => {
          logger('warn', 'spawn_command_error', command, commandArgs, error);

          reject([error, stdoutString, stderrString]);
        });

        pipeProcess.on('close', (code, signal) => {
          logger(
            'info',
            'spawn_command_exit',
            code,
            signal,
            command,
            commandArgs,
          );

          if (code && code > 0) {
            reject([
              new Error(`Command failed: ${command} ${commandArgs.join(' ')}`),
              stdoutString,
              stderrString,
            ]);

            return;
          }

          resolve();
        });
      });

      logger('info', 'streamlink_exited', channel.url);

      if (Date.now() - startTime < AUTO_RESTART_TIMEOUT * 1000) {
        autoRestartAttempts++;
      } else {
        autoRestartAttempts = 0;
      }

      firstStart = false;
      startTime = Date.now();
    } catch (exception) {
      const [error, stdout, stderr]: [Error, string, string] = exception;

      logger('warn', 'streamlink_error', channel.url, error, stdout, stderr);

      if (error['code'] === 'ENOENT') {
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
        printNotification('Streamlink Error', error.message);

        const [, message] = stdout.split('[cli][error]');

        if (message) {
          printNotification('Streamlink Error', message?.trim());
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

  logger('info', 'playing_closing', channel.url, channel._playingProcesses);

  channel._playingProcesses--;

  channel.changeSettings({
    onAutoRestart: false,
  });

  return;
}
