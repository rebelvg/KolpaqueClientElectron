import { app, ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { execFile } from 'child_process';
import * as _ from 'lodash';

import { config } from './SettingsFile';
import { Config } from './ConfigClass';
import { printNotification } from './Notifications';
import { Channel } from './ChannelClass';
import { addLogs } from './Logs';

const AUTO_RESTART_ATTEMPTS = 3;
const AUTO_RESTART_TIMEOUT = 60;

function setChannelEvents(channelObj) {
  channelObj.on('setting_changed', (settingName, settingValue) => {
    if (settingName === 'isLive' && !settingValue) {
      _.forEach(channelObj._windows, window => window.close());

      channelObj._windows = [];
    }
  });

  channelObj.on('play', (altQuality = false, autoRestart = null) => {
    if (config.settings.playInWindow) {
      if (!playInWindow(channelObj)) {
        launchPlayerObj(channelObj, altQuality, autoRestart);
      }
    } else {
      launchPlayerObj(channelObj, altQuality, autoRestart);
    }
  });
}

ipcMain.on('channel_play', (event, id, altQuality = false, autoRestart = null) => {
  let channelObj = config.findById(id);

  if (!channelObj) return false;

  channelObj.emit('play', altQuality, autoRestart);
});

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
  let channelObj = config.findById(id);

  if (!channelObj) return false;

  if (channelObj._processes.length > 0 && settingName === 'autoRestart' && settingValue) {
    channelObj.changeSetting('onAutoRestart', true);
  }
});

_.forEach(config.channels, setChannelEvents);
config.on('channel_added', setChannelEvents);

export function launchPlayerLink(channelLink, LQ = null) {
  let channelObj = Config.buildChannelObj(channelLink);

  if (channelObj === false) return false;

  launchPlayerObj(channelObj, LQ);
}

function playInWindow(channelObj) {
  let link;
  let window;

  if (channelObj.serviceObj.embed) {
    link = channelObj.serviceObj.embed(channelObj);
  } else {
    if (['http:', 'https:'].includes(channelObj.protocol)) {
      link = channelObj.link;
    }
  }

  if (link) {
    window = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        nodeIntegration: false
      }
    });

    window.loadURL(link);

    window.on('closed', () => {
      _.pull(channelObj._windows, window);

      window = null;
    });

    (app as any).mainWindow.on('closed', () => {
      if (window) {
        window.close();
      }
    });

    channelObj._windows.push(window);
  }

  return !!window;
}

function launchPlayerObj(channelObj: Channel, altQuality = false, autoRestart = null) {
  const LQ = !altQuality ? config.settings.LQ : !config.settings.LQ;

  if (autoRestart === null) {
    channelObj.changeSetting('onAutoRestart', channelObj.autoRestart);
  } else {
    channelObj.changeSetting('onAutoRestart', autoRestart);
  }

  let playLink = channelObj._customPlayUrl || channelObj.link;
  let params = [];

  if (channelObj.protocol === 'rtmp:') {
    playLink = `${playLink} live=1`;

    if (LQ && ['klpq-vps', 'klpq-main'].includes(channelObj.service)) {
      playLink = playLink.replace('/live/', '/restream/');
    }
  } else {
    if (LQ) {
      params = params.concat(['--stream-sorting-excludes', '>=720p,>=high']);
    }
  }

  launchStreamlink(playLink, params, channelObj);
}

function launchStreamlink(playLink, params, channelObj, firstStart = true) {
  addLogs(playLink, params);

  channelObj._startTime = Date.now();

  const childProcess = execFile(
    'streamlink',
    [playLink, 'best', '--twitch-disable-hosting'].concat(params),
    (err, data, stderr) => {
      addLogs(err);
      addLogs(data);
      addLogs('streamlink exited.');

      if (err) {
        if (err.code === 'ENOENT') {
          dialog.showMessageBox({
            type: 'error',
            message: 'Streamlink not found.'
          });

          channelObj.changeSetting('onAutoRestart', false);

          return shell.openExternal(`https://github.com/streamlink/streamlink/releases`);
        } else {
          if (firstStart) printNotification('Error', err.message);
        }
      }

      if (data.indexOf('error: ') >= 0) {
        const error = data.split('error: ');

        if (firstStart) printNotification('Error', error[1]);
      }

      if (Date.now() - channelObj._startTime < AUTO_RESTART_TIMEOUT * 1000) {
        channelObj._autoRestartAttempts++;
      } else {
        channelObj._autoRestartAttempts = 0;
      }

      if (channelObj.isLive && channelObj.onAutoRestart && channelObj._autoRestartAttempts < AUTO_RESTART_ATTEMPTS) {
        launchStreamlink(playLink, params, channelObj, false);
      } else {
        channelObj.changeSetting('onAutoRestart', false);

        channelObj._autoRestartAttempts = 0;
      }
    }
  );

  channelObj._processes.push(childProcess);

  childProcess.on('error', () => {
    _.pull(channelObj._processes, childProcess);
  });

  childProcess.on('exit', () => {
    _.pull(channelObj._processes, childProcess);
  });

  return childProcess;
}
