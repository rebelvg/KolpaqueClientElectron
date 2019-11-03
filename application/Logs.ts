import { ipcMain } from 'electron';

const logs: string[] = [];

ipcMain.on('config_logs', event => {
  event.returnValue = logs;
});

export function addLogs(...log: any[]) {
  const logLine = log.map(logItem => JSON.stringify(logItem)).join(' ');

  console.log(logLine);

  logs.push(logLine);
}
