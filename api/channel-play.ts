import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
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
    addLogs('info', 'channel_play', id, altQuality, autoRestart);

    const channel = config.findById(id);

    if (!channel) {
      return false;
    }

    await channel.startPlaying(altQuality, autoRestart);
  },
);

export async function launchPlayerLink(
  channelLink: string,
  LQ: boolean,
): Promise<boolean> {
  addLogs('info', 'launchPlayerLink', {
    channelLink,
    LQ,
  });

  const channel = Config.buildChannel(channelLink);

  if (!channel) {
    return false;
  }

  await channel.startPlaying(LQ, false);

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
    autoHideMenuBar: true,
  });

  window.on('closed', () => {
    _.pull(channel._windows, window);
  });

  main.mainWindow!.on('closed', () => {
    if (window && !window.isDestroyed) {
      window.close();
    }
  });

  window.setMenu(null);

  try {
    await window.loadURL(embedLink);

    main.createdWindows.push(window);

    channel._windows.push(window);
  } catch (error) {
    addLogs('warn', error, embedLink);

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

  const { playLink, params } = !LQ
    ? await channel.play()
    : await channel.playLQ();

  if (!playLink) {
    return;
  }

  return launchStreamlink(playLink, params, channel);
}

async function launchStreamlink(
  playLink: string,
  params: string[],
  channel: Channel,
) {
  addLogs('info', playLink, params, channel.link);

  if (!playLink) {
    return;
  }

  let firstStart = true;
  let autoRestartAttempts = 0;
  let startTime = Date.now();

  channel._playingProcesses++;

  while (true) {
    addLogs(
      'info',
      'streamlink_starting',
      channel.link,
      firstStart,
      autoRestartAttempts,
      channel._playingProcesses,
    );

    try {
      const [command, ...commandArgs] =
        [ProtocolsEnum.RTMP, ProtocolsEnum.RTMPS].includes(channel.protocol) &&
        config.settings.customRtmpClientCommand.includes('{{RTMP_URL}}')
          ? config.settings.customRtmpClientCommand
              .replace('{{RTMP_URL}}', playLink)
              .split(' ')
              .map((a) => a.trim())
          : ['streamlink', playLink, 'best', ...params];

      await new Promise<void>((resolve, reject) => {
        addLogs('info', 'spawn_command', command, commandArgs);

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
          addLogs('warn', 'spawn_command_error', command, commandArgs, error);

          reject([error, stdoutString, stderrString]);
        });

        pipeProcess.on('close', (code, signal) => {
          addLogs(
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

      addLogs('info', 'streamlink_exited', channel.link);

      if (Date.now() - startTime < AUTO_RESTART_TIMEOUT * 1000) {
        autoRestartAttempts++;
      } else {
        autoRestartAttempts = 0;
      }

      firstStart = false;
      startTime = Date.now();
    } catch (exception) {
      const [error, stdout, stderr] = exception;

      addLogs('warn', 'streamlink_error', channel.link, error, stdout, stderr);

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

  addLogs('info', 'playing_closing', channel.link, channel._playingProcesses);

  channel._playingProcesses--;

  channel.changeSettings({
    onAutoRestart: false,
  });

  return;
}
