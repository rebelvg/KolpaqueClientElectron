/**
 * Created by rebel on 21/03/2017.
 */

const request = require('request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';
let onlineChannels = [];
let mainWindow = null;

function ChannelCheck() {
}

function wentOnline(channelObj) {
    let settingsJson = new SettingsFile().returnSettings();

    let channelLink = channelObj.link;

    if (onlineChannels.indexOf(channelLink) > -1)
        return;

    console.log(channelLink + " went online.");

    onlineChannels.push(channelLink);

    mainWindow.webContents.send('channel-went-online', channelObj);

    new Notifications().printNotification('Stream is Live', channelObj.link);

    if (settingsJson.settings.autoPlay) {
        new ChannelPlay().launchPlayer(channelObj);
    }
}

function wentOffline(channelObj) {
    let channelLink = channelObj.link;

    var index = onlineChannels.indexOf(channelLink);

    if (index == -1)
        return;

    console.log(channelLink + " went offline.");

    onlineChannels.splice(index, 1);

    mainWindow.webContents.send('channel-went-offline', channelObj);
}

function getKlpqStats(channelObj) {
    let channelService = 'klpq';
    var url = "http://stats.klpq.men/channel/" + channelObj.name;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.isLive) {
                    wentOnline(channelObj);
                } else {
                    wentOffline(channelObj);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    })
}

function getTwitchStats(channelObj) {
    let channelService = 'twitch';
    var url = "https://api.twitch.tv/kraken/streams?channel=" + channelObj.name + "&client_id=" + twitchApiKey;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.streams.length > 0) {
                    wentOnline(channelObj);
                } else {
                    wentOffline(channelObj);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    })
}

function getStats(channelObj) {
    var channelService = channelObj.service;

    switch (channelService) {
        case 'klpq':
            getKlpqStats(channelObj);
            break;
        case 'twitch':
            getTwitchStats(channelObj);
            break;
        default:
            break;
    }
}

function twitchImport(twitchChannel) {
    twitchChannel = twitchChannel.replace(/\s+/g, '').toLowerCase();

    if (twitchChannel.length == 0)
        return false;

    var url = "https://api.twitch.tv/kraken/users/" + twitchChannel + "/follows/channels" + "?client_id=" + twitchApiKey + "&limit=200";

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                let channels = body.follows.reverse();

                channels.forEach(function (channel) {
                    let channelObj = new SettingsFile().addChannel(channel.channel.url);

                    if (channelObj !== false)
                        mainWindow.webContents.send('add-channel-response', {status: true, channel: channelObj});
                });

                console.log('import done.');
            }
            catch (e) {
                console.log(e);
            }
        }
    })
}

function checkLoop(mainWindowRef) {
    let settingsJson = new SettingsFile().returnSettings();
    mainWindow = mainWindowRef;

    setInterval(function () {
        for (var channel in settingsJson.channels) {
            if (settingsJson.channels.hasOwnProperty(channel)) {
                let channelObj = settingsJson.channels[channel];

                getStats(channelObj);
            }
        }
    }, 5000);
}

ChannelCheck.prototype.twitchImport = twitchImport;
ChannelCheck.prototype.checkLoop = checkLoop;

module.exports = ChannelCheck;
