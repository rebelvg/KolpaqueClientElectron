import { ipcMain } from 'electron';
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

export function addLogs(
  level: 'error' | 'info' | 'debug',
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
    .map((log) =>
      util.inspect(log, {
        depth: 1,
        compact: true,
        breakLength: Infinity,
      }),
    )
    .join(' ');

  if (['error', 'info'].includes(level)) {
    // eslint-disable-next-line no-console
    console.log(level, logLine);
  }

  fs.appendFileSync(
    appLogPath,
    `${new Date().toLocaleString()} ${logLine}${os.EOL}`,
  );

  if (['error'].includes(level)) {
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
