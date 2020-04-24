import { app, ipcMain, shell } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';
import { printNotification } from './Notifications';
import { addLogs } from './Logs';
import { githubClient } from './ApiClients';

const { version } = require('../package.json');

const updates = {
  client: {
    releaseLink: 'https://github.com/rebelvg/KolpaqueClientElectron/releases',
    interval: null
  },
  streamlink: {
    releaseLink: 'https://github.com/streamlink/streamlink/releases',
    interval: null
  }
};

const infoArray = [];

ipcMain.on('client_getInfo', (event, info) => {
  _.forEach(infoArray, value => {
    if (updates.hasOwnProperty(value)) {
      shell.openExternal(updates[value].releaseLink);
    }
  });
});

ipcMain.on('client_getVersion', event => (event.returnValue = version));

ipcMain.once('client_ready', checkLoop);

function sendInfo(update) {
  infoArray.push(update);

  printNotification(`${_.capitalize(update)} Update Available`, updates[update].releaseLink);

  (app as any).mainWindow.webContents.send(
    'client_showInfo',
    infoArray.map(_.capitalize).join(' & ') + ' Update Available'
  );
}

async function clientVersionCheck() {
  if (infoArray.includes('client')) {
    return clearInterval(updates['client'].interval);
  }

  const versionData = await githubClient.getLatestVersion();

  if (!versionData) {
    return;
  }

  const newVersion = versionData.tag_name;

  if (newVersion !== version) {
    sendInfo('client');
  }
}

function streamlinkVersionCheck() {
  if (infoArray.includes('streamlink')) {
    return clearInterval(updates['streamlink'].interval);
  }

  execFile('streamlink', ['--version-check'], function(err, data, stderr) {
    if (err) {
      addLogs(err);

      return;
    }

    let regExp = new RegExp(/A new version of Streamlink \((.*)\) is available!/gi);

    if (regExp.test(data)) sendInfo('streamlink');
  });
}

function checkLoop() {
  clientVersionCheck();
  streamlinkVersionCheck();

  updates['client'].interval = setInterval(clientVersionCheck, 30 * 60 * 1000);
  updates['streamlink'].interval = setInterval(streamlinkVersionCheck, 30 * 60 * 1000);
}
