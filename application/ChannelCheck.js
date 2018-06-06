const {app, ipcMain, dialog, shell} = require('electron');
const request = require('request');
const _ = require('lodash');
const util = require('util');
const {URL, URLSearchParams} = require('url');
const childProcess = require('child_process');

const config = require('./SettingsFile');
const Notifications = require('./Notifications');
const {twitchApiKey} = require('./Globals');
const {getInfoAsync} = require('./ChannelInfo');

const SERVICES = {
    'klpq-vps': getKlpqVpsStats,
    'klpq-main': getKlpqMainStats,
    'twitch': getTwitchStats,
    'youtube-user': getYoutubeStatsUser,
    'youtube-channel': getYoutubeStatsChannel,
    'custom': getCustom
};

const SERVICES_INTERVALS = {
    'klpq-vps': {
        check: 5,
        confirmations: 0
    },
    'klpq-main': {
        check: 5,
        confirmations: 0
    },
    'twitch': {
        check: 30,
        confirmations: 3
    },
    'youtube-user': {
        check: 120,
        confirmations: 3
    },
    'youtube-channel': {
        check: 120,
        confirmations: 3
    },
    'custom': {
        check: 120,
        confirmations: 3
    }
};

ipcMain.once('client_ready', checkLoop);

config.on('channel_added', checkChannel);

async function isOnline(channelObj, printBalloon) {
    channelObj._offlineConfirmations = 0;

    if (channelObj.isLive) return;

    await getInfoAsync(channelObj);

    console.log(`${channelObj.link} went online.`);

    if (printBalloon) {
        Notifications.printNotification('Stream is Live', channelObj.visibleName, channelObj);
    }

    if (printBalloon && config.settings.showNotifications && channelObj.autoStart) {
        if (channelObj._processes.length === 0) {
            if (config.settings.confirmAutoStart) {
                dialog.showMessageBox({
                    type: 'none',
                    message: `${channelObj.link} is trying to auto-start. Confirm?`,
                    buttons: ['Ok', 'Cancel']
                }, function (res) {
                    if (res === 0) {
                        channelObj.emit('play');
                    }
                });
            } else {
                channelObj.emit('play');
            }
        }
    }

    channelObj.changeSettings({
        lastUpdated: Date.now(),
        isLive: true
    });
}

function isOffline(channelObj) {
    if (!channelObj.isLive) return;

    channelObj._offlineConfirmations++;

    if (channelObj._offlineConfirmations < _.get(SERVICES_INTERVALS, [channelObj.service, 'confirmations'], 0)) return;

    console.log(`${channelObj.link} went offline.`);

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
    return new Promise(resolve => {
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

            resolve();
        });
    });
}

function getYoutubeStatsChannel(channelObj, printBalloon) {
    let apiKey = config.settings.youtubeApiKey;

    if (!apiKey) return;

    getYoutubeStatsBase(channelObj.name, channelObj, printBalloon, apiKey);
}

async function checkChannel(channelObj, printBalloon = false) {
    if (SERVICES.hasOwnProperty(channelObj.service)) {
        await SERVICES[channelObj.service](channelObj, printBalloon);
    }
}

function checkLoop() {
    _.forEach(config.channels, (channelObj) => {
        checkChannel(channelObj, false);
    });

    _.forEach(SERVICES_INTERVALS, (service, serviceName) => {
        setInterval(async function () {
            for (const channelObj of config.channels) {
                if (channelObj.service === serviceName) {
                    await checkChannel(channelObj, true);
                }
            }
        }, service.check * 1000);
    });
}
