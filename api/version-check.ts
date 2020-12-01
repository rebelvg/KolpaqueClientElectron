import { app, ipcMain, shell } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';
import { printNotification } from './Notifications';
import { addLogs } from './Logs';
import { githubClient } from './api-clients';
import { sleep } from './channel-check';
import { CLIENT_VERSION } from './globals';

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

ipcMain.on('client_getInfo', async () => {
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

  app['mainWindow'].webContents.send(
    'client_showInfo',
    UPDATES.map(_.capitalize).join(' & ') + ' Update Available',
  );
}

async function clientVersionCheck(): Promise<boolean> {
  const versionData = await githubClient.getLatestVersion();

  if (!versionData) {
    return false;
  }

  const newVersion = versionData.tag_name;

  if (newVersion !== CLIENT_VERSION) {
    return true;
  }
}

function streamlinkVersionCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('streamlink', ['--version-check'], (err: any, data) => {
      if (err) {
        addLogs(err);

        if (err.code === 'ENOENT') {
          return resolve(true);
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
