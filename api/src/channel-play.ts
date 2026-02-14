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
const AUTO_RESTART_TIMEOUT_MS = 60 * 1000;

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

  while (true) {
    logger(
      'info',
      'streamlink_starting',
      channel.url,
      firstStart,
      autoRestartAttempts,
      channel._playingProcesses.length,
    );

    try {
      let command = 'streamlink';
      let commandArgs = [playUrl, 'best', ...params];

      if (
        [ProtocolsEnum.RTMP, ProtocolsEnum.RTMPS].includes(channel.protocol) &&
        config.settings.customRtmpClientCommand
      ) {
        const [customCommand, ...customCommandArgs] =
          config.settings.customRtmpClientCommand
            .replace('{{RTMP_URL}}', playUrl)
            .split(' ')
            .map((a) => a.trim());

        command = customCommand!;
        commandArgs = customCommandArgs;
      }

      logger('info', 'spawn_command', command, commandArgs);

      const pipeProcess = spawn(command, commandArgs);

      channel._playingProcesses.push(pipeProcess);

      await new Promise<void>((resolve, reject) => {
        const stdoutString: string[] = [];
        const stderrString: string[] = [];

        pipeProcess.stdout.on('data', (data: Buffer) => {
          if (command.toLowerCase() === 'streamlink') {
            stdoutString.push(data.toString('utf-8'));
          }
        });

        pipeProcess.stderr.on('data', (data: Buffer) => {
          stderrString.push(data.toString('utf-8'));
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

      _.pull(channel._playingProcesses, pipeProcess);

      logger('info', 'streamlink_exited', channel.url);

      if (Date.now() - startTime > AUTO_RESTART_TIMEOUT_MS) {
        autoRestartAttempts = 0;

        startTime = Date.now();
      } else {
        autoRestartAttempts++;
      }
    } catch (exception) {
      const [error, stdout, stderr]: [Error, string[], string[]] = exception;

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
        const [, message = error.message] = stdout
          .join('')
          .split('[cli][error]');

        printNotification('Streamlink Error', message.trim());
      }
    }

    firstStart = false;

    if (!channel.isLive) {
      break;
    }

    if (!channel.onAutoRestart) {
      break;
    }

    if (autoRestartAttempts > AUTO_RESTART_ATTEMPTS) {
      break;
    }
  }

  logger(
    'info',
    'playing_closing',
    channel.url,
    channel._playingProcesses.length,
  );

  channel.changeSettings({
    onAutoRestart: false,
  });

  return;
}
