import { ipcMain } from 'electron';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app } from 'electron';

const clientAppDataPath = path.join(app.getPath('appData'), 'KolpaqueClientElectron');

if (!fs.existsSync(clientAppDataPath)) {
  fs.mkdirSync(clientAppDataPath);
}

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
      if (logItem instanceof Error) {
        return logItem.stack;
      }

      return JSON.stringify(logItem);
    })
    .join(' ');

  console.log(logLine);

  fs.appendFileSync(appLogPath, `${new Date().toLocaleString()} - ${logLine}${os.EOL}`);

  logs.push(logLine);

  logs = _.takeRight(logs, 20);
}
