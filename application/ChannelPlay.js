/**
 * Created by rebel on 22/03/2017.
 */

const {ipcMain, dialog} = require('electron');
const fs = require('fs');
const SettingsFile = require('./SettingsFile');
const Notifications = require('./Notifications');
const ChannelCheck = require('./ChannelCheck');
const _ = require('lodash');

let lastClosed = null;

let playUntilOffline = [];

ipcMain.on('channel-play', (event, channel) => {
    if (channel.untilOffline) {
        playUntilOffline.push(channel.link);

        console.log('until offline play enabled', channel.link);
    }

    launchPlayerLink(channel.link, channel.LQ, channel.untilOffline);
});

ipcMain.on('disable-until-offline-play', (event, channel) => {
    _.remove(playUntilOffline, function (n) {
        return n === channel.link;
    });

    console.log('until offline play disabled', channel.link);
});

function launchPlayer(channelObj, LQ = null) {
    let channelLink = channelObj.link;

    launchPlayerLink(channelLink, LQ);
}

function launchPlayerLink(channelLink, LQ = null, untilOffline = false) {
    let channelObj = SettingsFile.buildChannelObj(channelLink);

    if (channelObj === false) {
        return false;
    }

    let settingsJson = SettingsFile.returnSettings();

    if (LQ === null) {
        LQ = settingsJson.settings.LQ;
    }

    let quality = [];

    if (channelObj.protocol === 'rtmp:') {
        channelLink += " live=1";

        if (LQ && channelObj.service.includes('klpq')) {
            channelLink = channelLink.replace('/live/', '/restream/');
        }
    } else {
        if (LQ) {
            quality = ['--stream-sorting-excludes', '>=720p,>=high'];
        }
    }

    let path = settingsJson.settings.livestreamerPath;

    if (fs.existsSync(path)) {
        let child = require('child_process').execFile;

        console.log('launching player for ' + channelLink);

        child(path, [channelLink, 'best', '--twitch-disable-hosting'].concat(quality), function (err, data, stderr) {
            console.log(err);
            console.log(data);
            console.log('streamlink exited.');

            if (err) {
                Notifications.printNotification('Error', err.message);
            }

            if (data.indexOf('error: ') >= 0) {
                let error = data.split('error: ');

                Notifications.printNotification('Error', error[1]);
            }

            lastClosed = {link: channelObj.link, LQ: LQ};

            if (untilOffline && playUntilOffline.includes(channelObj.link) && ChannelCheck.onlineChannels.hasOwnProperty(channelObj.link)) {
                console.log('restarting player.');
                launchPlayerLink(channelObj.link, LQ, untilOffline);
            }
        });
    } else {
        dialog.showMessageBox({
            type: 'error',
            message: path + ' not found.'
        });
    }
}

function launchLastClosed() {
    if (lastClosed) {
        launchPlayerLink(lastClosed.link, lastClosed.LQ);
    }
}

exports.launchPlayer = launchPlayer;
exports.launchPlayerLink = launchPlayerLink;
exports.launchLastClosed = launchLastClosed;
