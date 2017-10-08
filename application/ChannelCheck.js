/**
 * Created by rebel on 21/03/2017.
 */

const {app, ipcMain, dialog, shell} = require('electron');
const request = require('request');
const moment = require('moment');
const _ = require('lodash');
const util = require('util');

const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');
const Globals = require('./Globals');

let twitchApiKey = Globals.twitchApiKey;
let onlineChannels = {};

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

    if (printBalloon) {
        Notifications.printNotification('Stream is Live (' + moment().format('D/MMM, H:mm') + ')', channelObj.link);
    }

    if (channelObj.autoStart) {
        ChannelPlay.launchPlayerObj(channelObj);
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

    Notifications.rebuildIconMenu();
}

function getKlpqStatsBase(url, channelObj, printBalloon) {
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

    getKlpqStatsBase(url, channelObj, printBalloon);
}

function getKlpqMainStats(channelObj, printBalloon) {
    let url = "http://stats.main.klpq.men/channel/" + channelObj.name;

    getKlpqStatsBase(url, channelObj, printBalloon);
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

function getYoutubeStatsBase(url, channelObj, printBalloon) {
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

                    getYoutubeStatsBase(url, channelObj, printBalloon);
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

    getYoutubeStatsBase(url, channelObj, printBalloon);
}

function getStats5(channelObj, printBalloon = true) {
    switch (channelObj.service) {
        case 'klpq-vps':
            getKlpqVpsStats(channelObj, printBalloon);
            break;
        case 'klpq-main':
            getKlpqMainStats(channelObj, printBalloon);
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

const services = {
    'klpq-vps': getKlpqVpsStats,
    'klpq-main': getKlpqMainStats,
    'twitch': getTwitchStats,
    'youtube-user': getYoutubeStatsUser,
    'youtube-channel': getYoutubeStatsChannel
};

function checkChannel(channelObj) {
    if (services.hasOwnProperty(channelObj.service)) {
        services[channelObj.service](channelObj, false);
    }
}

function checkLoop() {
    let settingsJson = SettingsFile.settingsJson;

    _.forEach(settingsJson.channels, (channelObj) => {
        getStats5(channelObj, false);
        getStats30(channelObj, false);
        getStats120(channelObj, false);
    });

    setInterval(function () {
        _.forEach(settingsJson.channels, getStats5);
    }, 5 * 1000);

    setInterval(function () {
        _.forEach(settingsJson.channels, getStats30);
    }, 30 * 1000);

    setInterval(function () {
        _.forEach(settingsJson.channels, getStats120);
    }, 2 * 60 * 1000);
}

exports.checkChannel = checkChannel;
exports.checkLoop = checkLoop;
exports.onlineChannels = onlineChannels;
