/**
 * Created by rebel on 21/03/2017.
 */

const request = require('request');
const ChannelPlay = require('./ChannelPlay');

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';
let onlineChannels = {};

function ChannelCheck() {
}

function wentOnline(channelObj) {
    let channelService = channelObj.service;
    let channelName = channelObj.name;

    if (!onlineChannels.hasOwnProperty(channelService)) {
        onlineChannels[channelService] = [];
    }

    if (onlineChannels[channelService].indexOf(channelName) == -1) {
        console.log(channelService + " " + channelName + " went online.");

        onlineChannels[channelService].push(channelName);
    }
}

function wentOffline(channelObj) {
    let channelService = channelObj.service;
    let channelName = channelObj.name;

    if (!onlineChannels.hasOwnProperty(channelService)) {
        onlineChannels[channelService] = [];
    }

    var index = onlineChannels[channelService].indexOf(channelName);

    if (index > -1) {
        console.log(channelService + " " + channelName + " went offline.");

        onlineChannels[channelService].splice(1, index);
    }
}

function getKlpqStats(channelObj) {
    let channelService = 'klpq';
    var url = "http://stats.klpq.men/channel/" + channelObj.name;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.isLive) {
                    console.log(channelService + " " + channelObj.name + " is online.");

                    wentOnline(channelObj);
                } else {
                    console.log(channelService + " " + channelObj.name + " is offline.");

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
                    console.log(channelService + " " + channelObj.name + " is online.");

                    wentOnline(channelObj);
                } else {
                    console.log(channelService + " " + channelObj.name + " is offline.");

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

ChannelCheck.prototype.getStats = getStats;

module.exports = ChannelCheck;
