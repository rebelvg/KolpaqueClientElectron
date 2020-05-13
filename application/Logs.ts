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

let logs: string[] = [];

ipcMain.on('config_logs', event => {
  event.returnValue = logs.slice().reverse();
});

export function addLogs(...log: any[]) {
  const logLine = log
    .filter(logItem => logItem !== undefined)
    .map(logItem => {
      return util.inspect(logItem, { depth: 2 });
    })
    .join(' ');

  console.log(logLine);

  fs.appendFileSync(appLogPath, `${new Date().toLocaleString()} - ${logLine}${os.EOL}`);

  logs.push(logLine);

  logs = _.takeRight(logs, 20);
}

setInterval(() => {
  addLogs(`memory usage`, _.forEach(process.memoryUsage()));
}, 100 * 1000);
