import { ipcMain, shell } from 'electron';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app } from 'electron';
import * as util from 'util';
import { AxiosError } from 'axios';

const clientAppDataPath = app.getPath('userData');

export const appLogPath = path.join(clientAppDataPath, 'app.log');
export const crashLogPath = path.join(clientAppDataPath, 'crash.log');

let logsUi: string[] = [];

ipcMain.handle('config_logs', () => logsUi.slice().reverse());

ipcMain.on('logs_open_folder', () => {
  addLogs('info', 'logs_open_folder');

  shell.showItemInFolder(appLogPath);
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
        url: `${value?.request?.method} ${value?.request?.protocol}//${value?.request?.host}${value?.request?.path}`,
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

  if (['fatal', 'error', 'warn', 'info'].includes(level)) {
    // eslint-disable-next-line no-console
    console.log(level, logLine);
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
