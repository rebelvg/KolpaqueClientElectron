const {app, ipcMain, dialog, shell} = require('electron');
const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const util = require('util');
const {URL, URLSearchParams} = require('url');

const SettingsFile = require('./SettingsFile');
const {twitchApiKey, registeredServices} = require('./Globals');

let requestGet = util.promisify(request.get);

ipcMain.on('config_twitchImport', async (event, channelName) => {
    return await twitchImport(channelName);
});

ipcMain.once('client_ready', () => {
    importLoop();
});

function twitchImportChannels(channels, i) {
    channels.forEach(function (channel) {
        let channelObj = SettingsFile.addChannel(channel.channel.url);

        if (channelObj !== false) {
            i++;
        }
    });

    return i;
}

async function getTwitchData(url) {
    let response = await requestGet({url: url, json: true, headers: {'Client-ID': twitchApiKey}});
    return response.body;
}

async function twitchImportBase(channelName) {
    channelName = channelName.trim();

    if (channelName.length === 0)
        return null;

    try {
        let i = 0;

        let apiUrl = new URL(`https://api.twitch.tv/kraken/users/${channelName}/follows/channels`);

        apiUrl.searchParams.set('sortby', 'created_at');
        apiUrl.searchParams.set('direction', 'ASC');
        apiUrl.searchParams.set('limit', '100');

        let body = await getTwitchData(apiUrl.href);
        let channels = body.follows;

        if (!channels || channels.length === 0)
            return 0;

        SettingsFile.addChannel(`http://www.twitch.tv/${channelName}`);

        i = twitchImportChannels(channels, i);

        while (channels.length !== 0) {
            body = await getTwitchData(body._links.next);
            channels = body.follows;

            i = twitchImportChannels(channels, i);
        }

        return i;
    }
    catch (e) {
        console.log(e);

        return null;
    }
}

async function twitchImport(channelName) {
    let res = await twitchImportBase(channelName);

    if (res !== null) {
        dialog.showMessageBox({
            type: 'info',
            message: 'Import done. ' + res + ' channels added.'
        });

        return true;
    } else {
        dialog.showMessageBox({
            type: 'error',
            message: 'Import error.'
        });

        return false;
    }
}

function autoKlpqImport() {
    _.forEach([
        {
            url: 'http://stats.vps.klpq.men/channels',
            service: 'klpq-vps'
        }, {
            url: 'http://stats.main.klpq.men/channels',
            service: 'klpq-main'
        }
    ], function (importObj) {
        let url = importObj.url;
        let service = importObj.service;

        request.get({url: url, json: true}, function (error, res, body) {
            if (!error) {
                _.forEach(body.result, function (channel) {
                    let protocol = registeredServices[service].protocols[0];
                    let host = registeredServices[service].hosts[0];
                    let pathname = registeredServices[service].paths[0] + `${channel}`;

                    let channelUrl = protocol + "//" + host + pathname;

                    let channelObj = SettingsFile.addChannel(channelUrl);
                });
            }
        });
    });
}

function autoTwitchImport() {
    _.forEach(SettingsFile.settingsJson.settings.twitchImport, async function (channelName) {
        await twitchImportBase(channelName);
    });
}

function importLoop() {
    autoKlpqImport();
    autoTwitchImport();

    setInterval(autoKlpqImport, 10 * 60 * 1000);
    setInterval(autoTwitchImport, 10 * 60 * 1000);
}
