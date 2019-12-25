import { ipcMain } from 'electron';
import * as _ from 'lodash';

let logs: string[] = [];

ipcMain.on('config_logs', event => {
  event.returnValue = logs.slice().reverse();
});

export function addLogs(...log: any[]) {
  const logLine = log.map(logItem => JSON.stringify(logItem)).join(' ');

  console.log(logLine);

  logs.push(logLine);

  logs = _.takeRight(logs, 20);
}
