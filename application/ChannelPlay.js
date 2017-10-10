/**
 * Created by rebel on 22/03/2017.
 */

const {ipcMain, dialog, shell} = require('electron');
const fs = require('fs');
const child = require('child_process').execFile;
const _ = require('lodash');

const SettingsFile = require('./SettingsFile');
const Notifications = require('./Notifications');
const ChannelCheck = require('./ChannelCheck');
const Globals = require('./Globals');

ipcMain.on('channel_play', (event, id, LQ = null, autoRestart = null) => {
    let channelObj = SettingsFile.settingsJson.findById(id);

    if (!channelObj) {
        return false;
    }

    launchPlayerObj(channelObj, LQ, autoRestart);
});

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
    let channelObj = SettingsFile.settingsJson.findById(id);

    if (!channelObj) {
        return false;
    }

    if (channelObj._processes.length > 0 && settingName === 'autoRestart' && settingValue) {
        channelObj.changeSetting('onAutoRestart', true);
    }
});

function launchPlayerLink(channelLink, LQ = null) {
    let channelObj = Globals.buildChannelObj(channelLink);

    if (channelObj === false) {
        return false;
    }

    launchPlayerObj(channelObj, LQ);
}

function launchPlayerObj(channelObj, LQ = null, autoRestart = null) {
    let config = SettingsFile.settingsJson;

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

function launchStreamlink(playLink, params, channelObj) {
    console.log(playLink, params);

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
                Notifications.printNotification('Error', err.message);
            }
        }

        if (data.indexOf('error: ') >= 0) {
            let error = data.split('error: ');

            Notifications.printNotification('Error', error[1]);
        }

        if (channelObj.isLive && channelObj.onAutoRestart) {
            launchStreamlink(playLink, params, channelObj);
        } else {
            channelObj.changeSetting('onAutoRestart', false);
        }
    });

    channelObj._processes.push(childProcess);

    childProcess.on('exit', () => {
        _.pull(channelObj._processes, childProcess);
    });

    return childProcess;
}

function launchLastClosed() {
}

exports.launchPlayerLink = launchPlayerLink;
exports.launchPlayerObj = launchPlayerObj;
exports.launchLastClosed = launchLastClosed;
