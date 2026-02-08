import { ipcMain, shell } from 'electron';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app } from 'electron';
import * as util from 'util';
import { AxiosError } from 'axios';

const clientAppDataPath =
  process.env.NODE_ENV !== 'dev' ? app.getPath('userData') : './.config';

export const appLogPath = path.join(clientAppDataPath, 'app.log');
export const crashLogPath = path.join(clientAppDataPath, 'crash.log');

ipcMain.handle('config_logs', () => []);

ipcMain.on('logs_open_folder', () => {
  addLogs('info', 'logs_open_folder');

  shell.openPath(path.resolve(clientAppDataPath));
});

try {
  const { size } = fs.statSync(appLogPath);

  if (size > 256 * 1024 * 1024) {
    fs.renameSync(appLogPath, `${appLogPath}.old`);
  }
} catch (error) {
  addLogs('warn', error);
}

export function addLogs(
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug',
  ...logs: any[]
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

  if (process.env.NODE_ENV === 'dev') {
    switch (level) {
      case 'fatal':
      case 'error':
        // eslint-disable-next-line no-console
        console.error(level, logLine);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(level, logLine);
        break;
      case 'debug':
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(level, logLine);
        break;
    }
  } else {
    switch (level) {
      case 'fatal':
      case 'error':
        // eslint-disable-next-line no-console
        console.error(level, logLine);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(level, logLine);
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

export function run() {
  addLogs('info', 'memory_usage', process.memoryUsage());

  setInterval(
    () => addLogs('info', 'memory_usage', process.memoryUsage()),
    100 * 1000,
  );
}
