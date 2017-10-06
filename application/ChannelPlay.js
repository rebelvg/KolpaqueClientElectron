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

ipcMain.on('channel_play', (event, channelLink, LQ = null, autoRestart = false) => {
    let channelObj = SettingsFile.settingsJson.findChannelByLink(channelLink);

    if (!channelObj) {
        return false;
    }

    channelObj.autoRestart = autoRestart;

    launchPlayerObj(channelObj, LQ);
});

ipcMain.on('channel_disable_autoRestart', (event, channelLink) => {
    let channelObj = SettingsFile.settingsJson.findChannelByLink(channelLink);

    if (!channelObj) {
        return false;
    }

    channelObj.autoRestart = false;
});

function launchPlayerLink(channelLink, LQ = null) {
    let channelObj = Globals.buildChannelObj(channelLink);

    if (channelObj === false) {
        return false;
    }

    launchPlayerObj(channelObj, LQ);
}

function launchPlayerObj(channelObj, LQ = null) {
    let config = SettingsFile.settingsJson;

    if (LQ === null) {
        LQ = config.settings.LQ;
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

    launchStreamLink(playLink, params, channelObj);
}

function launchStreamLink(playLink, params, channelObj) {
    console.log(playLink, params);

    child('streamlink', [playLink, 'best', '--twitch-disable-hosting'].concat(params), function (err, data, stderr) {
        console.log(err);
        console.log(data);
        console.log('streamlink exited.');

        if (err) {
            if (err.code === 'ENOENT') {
                dialog.showMessageBox({
                    type: 'error',
                    message: 'Streamlink not found.'
                });

                return shell.openExternal(`https://github.com/streamlink/streamlink/releases`);
            } else {
                Notifications.printNotification('Error', err.message);
            }
        }

        if (data.indexOf('error: ') >= 0) {
            let error = data.split('error: ');

            Notifications.printNotification('Error', error[1]);
        }

        if (channelObj.isLive && channelObj.autoRestart) {
            launchStreamLink(playLink, params, channelObj);
        }
    });
}

function launchLastClosed() {
}

exports.launchPlayerLink = launchPlayerLink;
exports.launchPlayerObj = launchPlayerObj;
exports.launchLastClosed = launchLastClosed;
