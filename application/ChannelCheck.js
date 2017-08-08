/**
 * Created by rebel on 21/03/2017.
 */

const {ipcMain, dialog, shell} = require('electron');
const request = require('request');
const request_async = require('async-request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');
const moment = require('moment');
const lodash = require('lodash');

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
    let url = "http://stats.klpq.men/channel/" + channelObj.name;

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

function buildChannelObj(channelLink) {
    return SettingsFile.buildChannelObj(channelLink);
}

function getStats5(channelLink, printBalloon = true) {
    let channelObj = buildChannelObj(channelLink);

    switch (channelObj.service) {
        case 'klpq-main':
            getKlpqStats(channelObj, printBalloon);
            break;
    }
}

function getStats30(channelLink, printBalloon = true) {
    let channelObj = buildChannelObj(channelLink);

    switch (channelObj.service) {
        case 'twitch':
            getTwitchStats(channelObj, printBalloon);
            break;
    }
}

function getStats120(channelLink, printBalloon = true) {
    let channelObj = buildChannelObj(channelLink);

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
        let channelObj = SettingsFile.addChannel(channel.channel.url);

        if (channelObj !== false) {
            mainWindow.webContents.send('add-channel-response', {status: true, channel: channelObj});
            i++;
        }
    });

    return i;
}

async function twitchImport(twitchChannel) {
    twitchChannel = twitchChannel.replace(/\s+/g, '').toLowerCase();

    if (twitchChannel.length === 0)
        return;

    try {
        let url = "https://api.twitch.tv/kraken/users/" + twitchChannel + "/follows/channels?direction=ASC&limit=100&sortby=created_at&user=" + twitchChannel + "&client_id=" + twitchApiKey;

        let response = await request_async(url);
        response = JSON.parse(response.body);
        let channels = response.follows;

        console.log(channels.length);

        if (channels.length === 0)
            return;

        let i = 0;
        i = twitchImportChannels(channels, i);

        while (channels.length !== 0) {
            response = await request_async(response._links.next + "&client_id=" + twitchApiKey);
            response = JSON.parse(response.body);
            channels = response.follows;

            console.log(channels.length);

            i = twitchImportChannels(channels, i);
        }

        dialog.showMessageBox({
            type: 'info',
            message: 'Import done. ' + i + ' channels added.'
        });
    }
    catch (e) {
        console.log(e);

        dialog.showMessageBox({
            type: 'error',
            message: 'Import error.'
        });
    }
}

let buildsLink = "ftp://main.klpq.men:359/KolpaqueClientElectron/";

let newClientVersion = require('../package.json').version;

ipcMain.on('get-update', (event, data) => {
    console.log('get-update');

    shell.openExternal(buildsLink);
});

async function checkNewVersion() {
    try {
        let url = "https://api.github.com/repos/rebelvg/KolpaqueClientElectron/releases";

        let response = await request_async(url, {headers: {'user-agent': "KolpaqueClientElectron"}});
        response = JSON.parse(response.body);

        if (!response[0])
            return false;

        if (response[0].tag_name !== newClientVersion) {
            Notifications.printNotification("New Version Available", buildsLink);

            newClientVersion = response[0].tag_name;

            mainWindow.webContents.send('check-update', {text: 'Update Available'});
        }
    }
    catch (e) {
        console.log(e);
        return false;
    }

    return true;
}

async function checkLoop(mainWindowRef) {
    let settingsJson = SettingsFile.returnSettings();
    mainWindow = mainWindowRef;

    lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
        getStats5(channelLink, false);
        getStats30(channelLink, false);
        getStats120(channelLink, false);
    });

    await checkNewVersion();

    setInterval(function () {
        lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
            getStats5(channelLink);
        });
    }, 5 * 1000);

    setInterval(function () {
        lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
            getStats30(channelLink);
        });
    }, 30 * 1000);

    setInterval(function () {
        lodash.forEach(settingsJson.channels, function (channelObj, channelLink) {
            getStats120(channelLink);
        });
    }, 2 * 60 * 1000);

    setInterval(checkNewVersion, 10 * 60 * 1000);
}

exports.twitchImport = twitchImport;
exports.checkLoop = checkLoop;
exports.onlineChannels = onlineChannels;
