/**
 * Created by rebel on 22/03/2017.
 */

const {ipcMain, dialog, shell} = require('electron');
const fs = require('fs');
const child = require('child_process').execFile;
const _ = require('lodash');

const config = require('./SettingsFile');
const Config = require('./ConfigClass');
const Notifications = require('./Notifications');

const AUTO_RESTART_ATTEMPTS = 3;
const AUTO_RESTART_TIMEOUT = 60;

ipcMain.on('channel_play', (event, id, LQ = null, autoRestart = null) => {
    let channelObj = config.findById(id);

    if (!channelObj) return false;

    launchPlayerObj(channelObj, LQ, autoRestart);
});

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
    let channelObj = config.findById(id);

    if (!channelObj) return false;

    if (channelObj._processes.length > 0 && settingName === 'autoRestart' && settingValue) {
        channelObj.changeSetting('onAutoRestart', true);
    }
});

function launchPlayerLink(channelLink, LQ = null) {
    let channelObj = Config.buildChannelObj(channelLink);

    if (channelObj === false) return false;

    launchPlayerObj(channelObj, LQ);
}

function launchPlayerObj(channelObj, LQ = null, autoRestart = null) {
    if (LQ === null) {
        LQ = config.settings.LQ;
    }

    if (autoRestart === null) {
        channelObj.changeSetting('onAutoRestart', channelObj.autoRestart);
    } else {
        channelObj.changeSetting('onAutoRestart', autoRestart);
    }

    let playLink = channelObj.link;
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
    console.log(playLink, params);

    channelObj._startTime = Date.now();

    let childProcess = child('streamlink', [playLink, 'best', '--twitch-disable-hosting'].concat(params), function (err, data, stderr) {
        console.log(err);
        console.log(data);
        console.log('streamlink exited.');

        if (err) {
            if (err.code === 'ENOENT') {
                dialog.showMessageBox({
                    type: 'error',
                    message: 'Streamlink not found.'
                });

                channelObj.changeSetting('onAutoRestart', false);

                return shell.openExternal(`https://github.com/streamlink/streamlink/releases`);
            } else {
                if (firstStart) Notifications.printNotification('Error', err.message);
            }
        }

        if (data.indexOf('error: ') >= 0) {
            let error = data.split('error: ');

            if (firstStart) Notifications.printNotification('Error', error[1]);
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
    });

    channelObj._processes.push(childProcess);

    childProcess.on('error', () => {
        _.pull(channelObj._processes, childProcess);
    });

    childProcess.on('exit', () => {
        _.pull(channelObj._processes, childProcess);
    });

    return childProcess;
}

exports.launchPlayerLink = launchPlayerLink;
exports.launchPlayerObj = launchPlayerObj;
