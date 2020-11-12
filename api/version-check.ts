import { app, ipcMain, shell } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';
import { printNotification } from './Notifications';
import { addLogs } from './Logs';
import { githubClient } from './api-clients';
import { sleep } from './channel-check';

const { version } = require('../package.json');

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

ipcMain.on('client_getInfo', async (event, info) => {
  await Promise.all(
    SERVICES.map(service => {
      if (UPDATES.includes(service.name)) {
        shell.openExternal(service.link);
      }
    }),
  );
});

ipcMain.on('client_getVersion', event => (event.returnValue = version));

function sendInfo(update: string) {
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

  if (newVersion !== version) {
    return true;
  }
}

async function streamlinkVersionCheck() {
  return new Promise(resolve => {
    execFile('streamlink', ['--version-check'], function(
      err: any,
      data,
      stderr,
    ) {
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

export async function loop() {
  (async () => {
    while (true) {
      const hasUpdate = await clientVersionCheck();

      if (hasUpdate) {
        sendInfo('client');

        break;
      }

      await sleep(30 * 60 * 1000);
    }
  })();

  (async () => {
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
