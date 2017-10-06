/**
 * Created by rebel on 21/03/2017.
 */

const {ipcMain, dialog, shell} = require('electron');
const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const util = require('util');
const child = require('child_process').execFile;

const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');
const Globals = require('./Globals');

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';
let onlineChannels = {};
let mainWindow = null;
let buildsLink = "ftp://main.klpq.men:359/KolpaqueClientElectron/";
let clientVersion = require('../package.json').version;

ipcMain.on('twitch-import', async (event, channelName) => {
    return await twitchImport(channelName);
});

SettingsFile.settingsJson.on('channel_removed', (channelObj) => {
    delete onlineChannels[channelObj.link];

    Notifications.rebuildIconMenu();
});

function isOnline(channelObj, printBalloon) {
    let settingsJson = SettingsFile.settingsJson;

    let channelLink = channelObj.link;

    if (onlineChannels.hasOwnProperty(channelLink)) {
        onlineChannels[channelLink] = 0;
        return;
    }

    console.log(channelLink + " went online.");

    channelObj.changeSetting('isLive', true);

    onlineChannels[channelLink] = 0;

    mainWindow.webContents.send('channel-went-online', channelObj);

    if (printBalloon) {
        Notifications.printNotification('Stream is Live (' + moment().format('D/MMM, H:mm') + ')', channelObj.link);
    }

    if (settingsJson.settings.autoPlay) {
        ChannelPlay.launchPlayer(channelObj);
    }

    Notifications.rebuildIconMenu();
}

function isOffline(channelObj) {
    let channelLink = channelObj.link;

    if (!onlineChannels.hasOwnProperty(channelLink))
        return;

    onlineChannels[channelLink]++;

    if (onlineChannels[channelLink] < 3)
        return;

    console.log(channelLink + " went offline.");

    channelObj.changeSetting('isLive', false);

    delete onlineChannels[channelLink];

    mainWindow.webContents.send('channel-went-offline', channelObj);

    Notifications.rebuildIconMenu();
}

function getKlpqStats(channelObj, printBalloon) {
    let url = "http://stats.main.klpq.men/channel/" + channelObj.name;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.isLive) {
                    isOnline(channelObj, printBalloon);
                } else {
                    isOffline(channelObj);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}

function getKlpqVpsStats(channelObj, printBalloon) {
    let url = "http://stats.vps.klpq.men/channel/" + channelObj.name;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.isLive) {
                    isOnline(channelObj, printBalloon);
                } else {
                    isOffline(channelObj);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}

function getTwitchStats(channelObj, printBalloon) {
    let url = "https://api.twitch.tv/kraken/streams?channel=" + channelObj.name + "&client_id=" + twitchApiKey;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.streams.length > 0) {
                    isOnline(channelObj, printBalloon);
                } else {
                    isOffline(channelObj);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}

function getYoutubeStatsUser(channelObj, printBalloon) {
    let apiKey = SettingsFile.settingsJson.settings.youtubeApiKey;

    if (!apiKey) {
        return;
    }

    let idUrl = `https://www.googleapis.com/youtube/v3/channels?forUsername=${channelObj.name}&part=id&key=${apiKey}`;

    request({url: idUrl, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.items.length > 0) {
                    let channelId = body.items[0].id;
                    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`;

                    request({url: url, json: true}, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            try {
                                if (body.items.length > 0) {
                                    isOnline(channelObj, printBalloon);
                                } else {
                                    isOffline(channelObj);
                                }
                            }
                            catch (e) {
                                console.log(e);
                            }
                        }
                    });
                } else {
                    console.log('youtube user id not found.');
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}

function getYoutubeStatsChannel(channelObj, printBalloon) {
    let apiKey = SettingsFile.settingsJson.settings.youtubeApiKey;

    if (!apiKey) {
        return;
    }

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelObj.name}&type=video&eventType=live&key=${apiKey}`;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.items.length > 0) {
                    isOnline(channelObj, printBalloon);
                } else {
                    isOffline(channelObj);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    });
}

function getStats5(channelObj, printBalloon = true) {
    switch (channelObj.service) {
        case 'klpq-vps':
            getKlpqVpsStats(channelObj, printBalloon);
            break;
        case 'klpq-main':
            getKlpqStats(channelObj, printBalloon);
            break;
    }
}

function getStats30(channelObj, printBalloon = true) {
    switch (channelObj.service) {
        case 'twitch':
            getTwitchStats(channelObj, printBalloon);
            break;
    }
}

function getStats120(channelObj, printBalloon = true) {
    switch (channelObj.service) {
        case 'youtube-user':
            getYoutubeStatsUser(channelObj, printBalloon);
            break;
        case 'youtube-channel':
            getYoutubeStatsChannel(channelObj, printBalloon);
            break;
    }
}

function twitchImportChannels(channels, i) {
    channels.forEach(function (channel) {
        let channelObj = SettingsFile.addChannel(channel.channel.url, false);

        if (channelObj !== false) {
            mainWindow.webContents.send('channel_add', {status: true, channel: channelObj});
            i++;
        }
    });

    return i;
}

async function twitchImportBase(channelName) {
    channelName = channelName.trim().toLowerCase();

    if (channelName.length === 0)
        return null;

    let requestGet = util.promisify(request.get);

    try {
        let url = "https://api.twitch.tv/kraken/users/" + channelName + "/follows/channels?direction=ASC&limit=100&sortby=created_at&user=" + channelName + "&client_id=" + twitchApiKey;

        let response = await requestGet({url: url, json: true});
        let body = response.body;
        let channels = body.follows;

        if (!channels || channels.length === 0)
            return 0;

        let i = 0;
        i = twitchImportChannels(channels, i);

        while (channels.length !== 0) {
            response = await requestGet({url: body._links.next + "&client_id=" + twitchApiKey, json: true});
            body = response.body;
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
                    let protocol = Globals.registeredServices[service].protocols[0];
                    let host = Globals.registeredServices[service].hosts[0];
                    let pathname = Globals.registeredServices[service].paths[0] + `${channel}`;

                    let channelUrl = protocol + "//" + host + pathname;

                    let channelObj = SettingsFile.addChannel(channelUrl, false);

                    if (channelObj !== false) {
                        mainWindow.webContents.send('channel_add', {status: true, channel: channelObj});
                    }
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

ipcMain.on('get-update', (event, data) => {
    console.log('get-update');

    shell.openExternal(buildsLink);
});

function checkNewVersion() {
    let url = "https://api.github.com/repos/rebelvg/KolpaqueClientElectron/releases";

    request.get({url: url, json: true, headers: {'user-agent': "KolpaqueClientElectron"}}, function (err, res, body) {
        if (err) {
            return;
        }

        if (!body[0] || !body[0].tag_name) {
            return;
        }

        if (body[0].tag_name !== clientVersion) {
            Notifications.printNotification('Client Update Available', buildsLink);

            clientVersion = body[0].tag_name;

            mainWindow.webContents.send('check-update', {text: 'Client Update Available'});
        }
    });
}

function streamlinkVersionCheck() {
    child('streamlink', ['--version-check'], function (err, data, stderr) {
        if (err) {
            console.log(err);
            return;
        }

        if (!data.includes('is up to date!')) {
            console.log(data);
            Notifications.printNotification('Streamlink Update Available', `https://github.com/streamlink/streamlink/releases`);
        }
    });
}

function setWindowRef(mainWindowRef) {
    mainWindow = mainWindowRef;
}

function checkLoop() {
    let settingsJson = SettingsFile.settingsJson;

    _.forEach(settingsJson.channels, (channelObj) => {
        getStats5(channelObj, false);
        getStats30(channelObj, false);
        getStats120(channelObj, false);
    });

    checkNewVersion();
    streamlinkVersionCheck();
    autoKlpqImport();
    autoTwitchImport();

    setInterval(function () {
        _.forEach(settingsJson.channels, getStats5);
    }, 5 * 1000);

    setInterval(function () {
        _.forEach(settingsJson.channels, getStats30);
    }, 30 * 1000);

    setInterval(function () {
        _.forEach(settingsJson.channels, getStats120);
    }, 2 * 60 * 1000);

    setInterval(checkNewVersion, 10 * 60 * 1000);
    setInterval(autoKlpqImport, 10 * 60 * 1000);
    setInterval(autoTwitchImport, 10 * 60 * 1000);
}

exports.twitchImport = twitchImport;
exports.setWindowRef = setWindowRef;
exports.checkLoop = checkLoop;
exports.onlineChannels = onlineChannels;
