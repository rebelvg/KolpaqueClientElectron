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

ipcMain.handle('config_logs', () => logs.slice().reverse());

export function addLogs(...log: any[]): void {
  const logLine = util.inspect(log, {
    depth: Infinity,
    compact: true,
    breakLength: Infinity,
  });

  // eslint-disable-next-line no-console
  console.log(logLine);

  fs.appendFileSync(
    appLogPath,
    `${new Date().toLocaleString()} ${logLine}${os.EOL}`,
  );

  logs.push(logLine);

  logs = _.takeRight(logs, 50);
}

export function run() {
  setInterval(() => {
    addLogs('memory_usage', _.forEach(process.memoryUsage()));
  }, 100 * 1000);
}
