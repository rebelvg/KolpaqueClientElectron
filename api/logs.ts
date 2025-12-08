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

let logsUi: string[] = [];

ipcMain.handle('config_logs', () => logsUi.slice().reverse());

ipcMain.on('logs_open_folder', () => {
  addLogs('info', 'logs_open_folder');

  shell.openPath(path.resolve(clientAppDataPath));
});

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

  fs.appendFileSync(
    appLogPath,
    `${new Date().toISOString()} level:${level} ${logLine}${os.EOL}`,
  );

  fs.appendFileSync(
    `${appLogPath}-${level}`,
    `${new Date().toISOString()} ${logLine}${os.EOL}`,
  );

  if (['fatal', 'error', 'warn'].includes(level)) {
    logsUi.push(logLine);

    logsUi = _.takeRight(logsUi, 50);
  }
}

export function run() {
  addLogs('info', 'memory_usage', process.memoryUsage());

  setInterval(
    () => addLogs('info', 'memory_usage', process.memoryUsage()),
    100 * 1000,
  );
}
