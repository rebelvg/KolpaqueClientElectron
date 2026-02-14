import { ipcMain, shell, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app } from 'electron';
import * as util from 'util';
import { AxiosError } from 'axios';
import { main } from './main';

const clientAppDataPath =
  process.env.NODE_ENV !== 'dev' ? app.getPath('userData') : './.config';

export const appLogPath = path.join(clientAppDataPath, 'app.log');
export const crashLogPath = path.join(clientAppDataPath, 'crash.log');

const isTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent) =>
  main.mainWindow ? event.sender === main.mainWindow.webContents : false;

ipcMain.handle('config_logs', (event) => {
  if (!isTrustedSender(event)) {
    logger('warn', 'config_logs_blocked');

    return [];
  }

  return [];
});

ipcMain.on('logs_open_folder', (event) => {
  logger('info', 'logs_open_folder');

  if (!isTrustedSender(event)) {
    logger('warn', 'logs_open_folder_blocked');

    return;
  }

  shell.openPath(path.resolve(clientAppDataPath));
});

try {
  const { size } = fs.statSync(appLogPath);

  if (size > 256 * 1024 * 1024) {
    fs.renameSync(appLogPath, `${appLogPath}.old`);
  }
} catch (error) {
  logger('warn', error);
}

export function logger(
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug',
  ...logs: unknown[]
): void {
  _.forEach(logs, (value, key) => {
    if (!value) {
      return;
    }

    if (value instanceof AxiosError) {
      const stack = value.stack?.split('\n').map((value) => value.trim());

      logs[key] = {
        message: value.message,
        stack,
        url: `${value.config?.method} ${value.config?.url}`,
        status: value?.response?.status,
        data: value?.response?.data,
      };

      return;
    }

    if (value instanceof Error) {
      const stack = value.stack?.split('\n').map((value) => value.trim());

      logs[key] = {
        message: value.message,
        stack,
      };

      return;
    }
  });

  const logLine = logs
    .map((log) => {
      if (typeof log === 'undefined') {
        return typeof log;
      }

      if (typeof log === 'object') {
        return util.inspect(log, {
          depth: 1,
          compact: true,
          breakLength: Infinity,
        });
      }

      return log;
    })
    .join(' ');

  const consoleLogLine = [`level:${level}`, logLine];

  if (process.env.NODE_ENV === 'dev') {
    switch (level) {
      case 'fatal':
      case 'error':
        // eslint-disable-next-line no-console
        console.error(...consoleLogLine);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(...consoleLogLine);
        break;
      case 'debug':
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(...consoleLogLine);
        break;
    }
  } else {
    switch (level) {
      case 'fatal':
      case 'error':
        // eslint-disable-next-line no-console
        console.error(...consoleLogLine);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(...consoleLogLine);
        break;
      default:
        break;
    }
  }

  fs.promises
    .appendFile(
      appLogPath,
      `${new Date().toISOString()} level:${level} ${logLine}${os.EOL}`,
    )
    .catch();

  if (['fatal', 'error', 'warn'].includes(level)) {
    fs.promises
      .appendFile(
        `${appLogPath}-${level}`,
        `${new Date().toISOString()} ${logLine}${os.EOL}`,
      )
      .catch();
  }
}

export function init() {
  logger('info', 'memory_usage', process.memoryUsage());

  setInterval(
    () => logger('info', 'memory_usage', process.memoryUsage()),
    100 * 1000,
  );
}
