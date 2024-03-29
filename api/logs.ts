import { ipcMain } from 'electron';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app } from 'electron';
import * as util from 'util';

const clientAppDataPath = app.getPath('userData');

export const appLogPath = path.join(clientAppDataPath, 'app.log');
export const crashLogPath = path.join(clientAppDataPath, 'crash.log');

let logsUi: string[] = [];

ipcMain.handle('config_logs', () => logsUi.slice().reverse());

export function addLogs(...logs: any[]): void {
  _.forEach(logs, (value, key) => {
    if (!!value && typeof value === 'object') {
      if (value.constructor.name === 'Error') {
        const stack = value.stack.split('\n').map((value) => value.trim());

        if (value?.response) {
          logs[key] = {
            message: value.message,
            stack,
            uri: `${value?.request?.method} ${value?.request?.protocol}//${value?.request?.host}${value?.request?.path}`,
            status: value?.response?.status,
            data: value?.response?.data,
          };
        } else {
          logs[key] = {
            message: value.message,
            stack,
          };
        }
      } else {
        logs[key] = JSON.stringify(value);
      }
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

  // eslint-disable-next-line no-console
  console.log(logLine);

  fs.appendFileSync(
    appLogPath,
    `${new Date().toLocaleString()} ${logLine}${os.EOL}`,
  );

  logsUi.push(logLine);

  logsUi = _.takeRight(logsUi, 50);
}

export function run() {
  addLogs('memory_usage', process.memoryUsage());

  setInterval(() => addLogs('memory_usage', process.memoryUsage()), 100 * 1000);
}
