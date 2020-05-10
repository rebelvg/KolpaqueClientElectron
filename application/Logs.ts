import { ipcMain } from 'electron';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as os from 'os';

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

  fs.appendFileSync('./app.log', `${new Date().toLocaleString()} - ${logLine}${os.EOL}`);

  logs.push(logLine);

  logs = _.takeRight(logs, 20);
}
