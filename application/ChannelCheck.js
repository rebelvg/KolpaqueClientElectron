/**
 * Created by rebel on 21/03/2017.
 */

const {app, ipcMain, dialog, shell} = require('electron');
const request = require('request');
const _ = require('lodash');
const util = require('util');
const {URL, URLSearchParams} = require('url');
const childProcess = require('child_process');

const config = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');
const {twitchApiKey} = require('./Globals');
const {getInfoAsync} = require('./ChannelInfo');

let onlineChannels = {};

const services = {
    'klpq-vps': getKlpqVpsStats,
    'klpq-main': getKlpqMainStats,
    'twitch': getTwitchStats,
    'youtube-user': getYoutubeStatsUser,
    'youtube-channel': getYoutubeStatsChannel,
    'custom': getCustom
};

ipcMain.once('client_ready', () => {
    checkLoop();
});

config.on('channel_added', (channelObj) => {
    checkChannel(channelObj);
});

config.on('channel_removed', (channelObj) => {
    delete onlineChannels[channelObj.link];
});

async function isOnline(channelObj, printBalloon) {
    let channelLink = channelObj.link;

    if (onlineChannels.hasOwnProperty(channelLink)) {
        onlineChannels[channelLink] = 0;
        return;
    }

    await getInfoAsync(channelObj);

    console.log(channelLink + " went online.");

    onlineChannels[channelLink] = 0;

    if (printBalloon) {
        Notifications.printNotification('Stream is Live', channelObj.visibleName, channelObj);
    }

    if (printBalloon && channelObj.autoStart) {
        if (channelObj._processes.length === 0) {
            if (config.settings.confirmAutoStart || channelObj.autoRestart) {
                dialog.showMessageBox({
                    type: 'none',
                    message: `${channelObj.link} is trying to auto-start. Confirm?`,
                    buttons: ['Ok', 'Cancel']
                }, function (res) {
                    if (res === 0) {
                        ChannelPlay.launchPlayerObj(channelObj);
                    }
                });
            }
        }
    }

    channelObj.changeSettings({
        lastUpdated: Date.now(),
        isLive: true
    });
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

    channelObj.changeSettings({
        lastUpdated: Date.now(),
        isLive: false
    });
}

function getKlpqStatsBase(url, channelObj, printBalloon) {
    request({url: url, json: true}, function (err, res, body) {
        if (err) return;
        if (res.statusCode !== 200) return;

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
    });
}

function getKlpqVpsStats(channelObj, printBalloon) {
    let url = `http://stats.vps.klpq.men/channel/${channelObj.name}`;

    getKlpqStatsBase(url, channelObj, printBalloon);
}

function getKlpqMainStats(channelObj, printBalloon) {
    let url = `http://stats.main.klpq.men/channel/${channelObj.name}`;

    getKlpqStatsBase(url, channelObj, printBalloon);
}

function getTwitchStats(channelObj, printBalloon) {
    let url = `https://api.twitch.tv/kraken/streams?channel=${channelObj.name}`;

    request({url: url, json: true, headers: {'Client-ID': twitchApiKey}}, async function (err, res, body) {
        if (err) return;
        if (res.statusCode !== 200) return;

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
    });
}

function getYoutubeStatsBase(channelId, channelObj, printBalloon, apiKey) {
    let searchUrl = new URL(`https://www.googleapis.com/youtube/v3/search`);

    searchUrl.searchParams.set('channelId', channelId);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('eventType', 'live');
    searchUrl.searchParams.set('key', apiKey);

    request({url: searchUrl.href, json: true}, function (err, res, body) {
        if (err) return;
        if (res.statusCode !== 200) return;

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
    });
}

function getYoutubeStatsUser(channelObj, printBalloon) {
    let apiKey = config.settings.youtubeApiKey;

    if (!apiKey) return;

    let channelsUrl = new URL(`https://www.googleapis.com/youtube/v3/channels`);

    channelsUrl.searchParams.set('forUsername', channelObj.name);
    channelsUrl.searchParams.set('part', 'id');
    channelsUrl.searchParams.set('key', apiKey);

    request({url: channelsUrl.href, json: true}, function (err, res, body) {
        if (err) return;
        if (res.statusCode !== 200) return;

        try {
            if (body.items.length > 0) {
                let channelId = body.items[0].id;

                getYoutubeStatsBase(channelId, channelObj, printBalloon, apiKey);
            } else {
                console.log('youtube user id not found.');
            }
        }
        catch (e) {
            console.log(e);
        }
    });
}

function getCustom(channelObj, printBalloon) {
    childProcess.execFile('streamlink', [channelObj.link, '--json'], function (err, stdout, stderr) {
        try {
            const res = JSON.parse(stdout);

            if (_.keys(res.streams).length > 0) {
                isOnline(channelObj, printBalloon);
            } else {
                isOffline(channelObj);
            }
        }
        catch (e) {
            console.log(e);
        }
    });
}

function getYoutubeStatsChannel(channelObj, printBalloon) {
    let apiKey = config.settings.youtubeApiKey;

    if (!apiKey) return;

    getYoutubeStatsBase(channelObj.name, channelObj, printBalloon, apiKey);
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

function getStats300(channelObj, printBalloon = true) {
    switch (channelObj.service) {
        case 'custom':
            getCustom(channelObj, printBalloon);
            break;
    }
}

function checkChannel(channelObj) {
    if (services.hasOwnProperty(channelObj.service)) {
        services[channelObj.service](channelObj, false);
    }
}

function checkLoop() {
    _.forEach(config.channels, (channelObj) => {
        getStats5(channelObj, false);
        getStats30(channelObj, false);
        getStats120(channelObj, false);
        getStats300(channelObj, false);
    });

    setInterval(function () {
        _.forEach(config.channels, (channelObj) => {
            getStats5(channelObj);
        });
    }, 5 * 1000);

    setInterval(function () {
        _.forEach(config.channels, (channelObj) => {
            getStats30(channelObj);
        });
    }, 30 * 1000);

    setInterval(function () {
        _.forEach(config.channels, (channelObj) => {
            getStats120(channelObj);
        });
    }, 2 * 60 * 1000);

    setInterval(function () {
        _.forEach(config.channels, (channelObj) => {
            getStats300(channelObj);
        });
    }, 5 * 60 * 1000);
}
