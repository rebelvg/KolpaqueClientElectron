import { ipcMain, shell, IpcMainEvent } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';
import { printNotification } from './notifications';
import { addLogs } from './logs';
import { githubClient } from './api-clients';
import { CLIENT_NAME, CLIENT_VERSION } from './globals';
import { main } from './main';
import { sleep } from './helpers';
import * as semver from 'semver';

const isTrustedSender = (event: IpcMainEvent) =>
  main.mainWindow ? event.sender === main.mainWindow.webContents : false;

const SERVICES = [
  {
    name: 'client',
    link: 'https://github.com/rebelvg/KolpaqueClientElectron/releases',
  },
  {
    name: 'streamlink',
    link: 'https://github.com/streamlink/streamlink/releases',
  },
];

const UPDATES: string[] = [];

ipcMain.on('client_getInfo', async (event) => {
  addLogs('info', 'client_getInfo');

  if (!isTrustedSender(event)) {
    addLogs('warn', 'client_getInfo_blocked');

    return;
  }

  await Promise.all(
    SERVICES.map((service) => {
      if (UPDATES.includes(service.name)) {
        shell.openExternal(service.link);
      }
    }),
  );
});

ipcMain.on('client_getName', (event) => {
  if (!isTrustedSender(event)) {
    addLogs('warn', 'client_getName_blocked');

    return;
  }

  event.returnValue = CLIENT_NAME;
});

ipcMain.on('client_getVersion', (event) => {
  if (!isTrustedSender(event)) {
    addLogs('warn', 'client_getVersion_blocked');

    return;
  }

  event.returnValue = `${CLIENT_VERSION}${
    process.env.NODE_ENV === 'dev' ? ' DEV' : ''
  }`;
});

function sendInfo(update: string): void {
  UPDATES.push(update);

  const service = _.find(SERVICES, { name: update });

  if (!service) {
    return;
  }

  printNotification(`${_.capitalize(update)} Update Available`, service.link);

  main.mainWindow!.webContents.send(
    'client_showInfo',
    UPDATES.map(_.capitalize).join(' & ') + ' Update Available',
  );
}

async function clientVersionCheck(): Promise<boolean> {
  const versionData = await githubClient.getLatestVersion();

  if (!versionData) {
    return false;
  }

  const githubVersion = versionData.tag_name;

  return semver.gt(githubVersion, CLIENT_VERSION);
}

function streamlinkVersionCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('streamlink', ['--version-check'], (error: Error, data) => {
      if (error) {
        addLogs('warn', error);

        if (error['code'] === 'ENOENT') {
          return resolve(false);
        }

        return resolve(false);
      }

      const regExp = new RegExp(
        /A new version of Streamlink \((.*)\) is available!/gi,
      );

      if (regExp.test(data)) {
        return resolve(true);
      }
    });
  });
}

export function loop(): void {
  (async (): Promise<void> => {
    while (true) {
      const hasUpdate = await clientVersionCheck();

      if (hasUpdate) {
        sendInfo('client');

        break;
      }

      await sleep(30 * 60 * 1000);
    }
  })();

  (async (): Promise<void> => {
    while (true) {
      const hasUpdate = await streamlinkVersionCheck();

      if (hasUpdate) {
        sendInfo('streamlink');

        break;
      }

      await sleep(30 * 60 * 1000);
    }
  })();
}
