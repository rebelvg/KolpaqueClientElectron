/**
 * Created by rebel on 21/03/2017.
 */

const request = require('request');
const SettingsFile = require('./SettingsFile');
const Notifications = require('./Notifications');

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';
let onlineChannels = [];
let mainWindow = null;

function ChannelCheck() {
}

function wentOnline(channelObj) {
    let channelLink = channelObj.link;

    if (onlineChannels.indexOf(channelLink) > -1)
        return;

    console.log(channelLink + " went online.");

    onlineChannels.push(channelLink);

    mainWindow.webContents.send('channel-went-online', channelObj);

    new Notifications().printNotification('Stream is Live', channelObj.link);
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

ChannelCheck.prototype.checkLoop = checkLoop;

module.exports = ChannelCheck;
