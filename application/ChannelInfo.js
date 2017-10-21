const {app, ipcMain, dialog, shell, nativeImage} = require('electron');
const _ = require('lodash');
const request = require('request');

const SettingsFile = require('./SettingsFile');
const {twitchApiKey} = require('./Globals');

ipcMain.once('client_ready', () => {
    checkLoop();
});

const services = {
    'twitch': getTwitchInfo
};

function getTwitchInfo(channelObj) {
    let url = `https://api.twitch.tv/kraken/channels/${channelObj.name}`;

    request.get({url: url, json: true, headers: {'Client-ID': twitchApiKey}}, function (err, res, body) {
        if (err) {
            return;
        }

        if (res.statusCode !== 200) {
            return;
        }

        if (!body.logo) {
            return;
        }

        request.get(body.logo, {encoding: null}, function (err, res, buffer) {
            if (err) {
                return;
            }

            channelObj._icon = nativeImage.createFromBuffer(buffer);
        });
    });
}

function getInfo(channelObj) {
    if (services.hasOwnProperty(channelObj.service)) {
        services[channelObj.service](channelObj);
    }
}

function checkLoop() {
    let settingsJson = SettingsFile.settingsJson;

    _.forEach(settingsJson.channels, (channelObj) => {
        getInfo(channelObj);
    });
}
