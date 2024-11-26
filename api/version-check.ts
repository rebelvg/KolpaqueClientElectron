import { ipcMain, shell } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';
import { printNotification } from './notifications';
import { addLogs } from './logs';
import { githubClient } from './api-clients';
import { CLIENT_VERSION } from './globals';
import { main } from './main';
import { sleep } from './helpers';
import * as semver from 'semver';

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

const isDev = process.env.NODE_ENV === 'dev';

ipcMain.on('client_getInfo', async () => {
  addLogs('info', 'client_getInfo');

  await Promise.all(
    SERVICES.map((service) => {
      if (UPDATES.includes(service.name)) {
        shell.openExternal(service.link);
      }
    }),
  );
});

ipcMain.on(
  'client_getVersion',
  (event) => (event.returnValue = CLIENT_VERSION),
);

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
        addLogs('error', error);

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
    // eslint-disable-next-line no-constant-condition
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
    // eslint-disable-next-line no-constant-condition
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
