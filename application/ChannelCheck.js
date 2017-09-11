/**
 * Created by rebel on 21/03/2017.
 */

const {ipcMain, dialog, shell} = require('electron');
const request = require('request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');
const moment = require('moment');
const lodash = require('lodash');
const {URL} = require('url');
const util = require('util');
const child = require('child_process').execFile;

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';
let onlineChannels = {};
let mainWindow = null;

ipcMain.on('twitch-import', (event, channel) => {
    twitchImport(channel);
});

function isOnline(channelObj, printBalloon) {
    let settingsJson = SettingsFile.returnSettings();

    let channelLink = channelObj.link;

    if (onlineChannels.hasOwnProperty(channelLink)) {
        onlineChannels[channelLink] = 0;
        return;
    }

    console.log(channelLink + " went online.");

    onlineChannels[channelLink] = 0;

    mainWindow.webContents.send('channel-went-online', channelObj);

    if (printBalloon) {
        Notifications.printNotification('Stream is Live (' + moment().format('D/MMM, H:mm') + ')', channelObj.link);
    }

    if (settingsJson.settings.autoPlay) {
        ChannelPlay.launchPlayer(channelObj);
    }

    Notifications.rebuildIconMenu(Object.keys(onlineChannels));
}

function isOffline(channelObj) {
    let channelLink = channelObj.link;

    if (!onlineChannels.hasOwnProperty(channelLink))
        return;

    onlineChannels[channelLink]++;

    if (onlineChannels[channelLink] < 3)
        return;

    console.log(channelLink + " went offline.");

    delete onlineChannels[channelLink];

    mainWindow.webContents.send('channel-went-offline', channelObj);

    Notifications.rebuildIconMenu(Object.keys(onlineChannels));
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
        case 'klpq-main':
            getKlpqStats(channelObj, printBalloon);
            break;
        case 'klpq-vps':
            getKlpqVpsStats(channelObj, printBalloon);
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
            mainWindow.webContents.send('add-channel-response', {status: true, channel: channelObj});
            i++;
        }
    });

    return i;
}

async function twitchImportBase(twitchChannel) {
    twitchChannel = twitchChannel.replace(/\s+/g, '').toLowerCase();

    if (twitchChannel.length === 0)
        return null;

    let requestGet = util.promisify(request.get);

    try {
        let url = "https://api.twitch.tv/kraken/users/" + twitchChannel + "/follows/channels?direction=ASC&limit=100&sortby=created_at&user=" + twitchChannel + "&client_id=" + twitchApiKey;

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

async function twitchImport(twitchChannel) {
    let res = await twitchImportBase(twitchChannel);

    if (res !== null) {
        dialog.showMessageBox({
            type: 'info',
            message: 'Import done. ' + res + ' channels added.'
        });
    } else {
        dialog.showMessageBox({
            type: 'error',
            message: 'Import error.'
        });
    }
}

function autoKlpqImport() {
    let url = 'http://stats.vps.klpq.men/channels';

    request.get({url: url, json: true}, function (error, res, body) {
        if (!error) {
            lodash.forEach(body.result, function (channel) {
                let protocol = SettingsFile.registeredServices['klpq-vps'].protocols[0];
                let host = SettingsFile.registeredServices['klpq-vps'].hosts[0];
                let pathname = SettingsFile.registeredServices['klpq-vps'].paths[0] + `${channel}`;

                let channelUrl = protocol + "//" + host + pathname;

                let channelObj = SettingsFile.addChannel(channelUrl, false);

                if (channelObj !== false) {
                    mainWindow.webContents.send('add-channel-response', {status: true, channel: channelObj});
                }
            });
        }
    });
}

function autoTwitchImport() {
    lodash.forEach(SettingsFile.settingsJson.settings.twitchImport, async function (value) {
        await twitchImportBase(value);
    });
}

let buildsLink = "ftp://main.klpq.men:359/KolpaqueClientElectron/";

let clientVersion = require('../package.json').version;

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

function checkLoop(mainWindowRef) {
    let settingsJson = SettingsFile.returnSettings();
    mainWindow = mainWindowRef;

    lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
        getStats5(channelObj, false);
        getStats30(channelObj, false);
        getStats120(channelObj, false);
    });

    checkNewVersion();
    streamlinkVersionCheck();
    autoKlpqImport();
    autoTwitchImport();

    setInterval(function () {
        lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
            getStats5(channelObj);
        });
    }, 5 * 1000);

    setInterval(function () {
        lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
            getStats30(channelObj);
        });
    }, 30 * 1000);

    setInterval(function () {
        lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
            getStats120(channelObj);
        });
    }, 2 * 60 * 1000);

    setInterval(checkNewVersion, 10 * 60 * 1000);
    setInterval(autoKlpqImport, 10 * 60 * 1000);
    setInterval(autoTwitchImport, 10 * 60 * 1000);
}

exports.twitchImport = twitchImport;
exports.checkLoop = checkLoop;
exports.onlineChannels = onlineChannels;
