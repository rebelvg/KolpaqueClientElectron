/**
 * Created by rebel on 21/03/2017.
 */

var request = require("request");
let twitchApiKey = "dk330061dv4t81s21utnhhdona0a91x";
let onlineChannels = [];

function ChannelCheck() {
}

function WentOnline(service, channel) {
    if (!onlineChannels.hasOwnProperty(service)) {
        onlineChannels[service] = [];
    }

    if (onlineChannels[service].indexOf(channel) == -1) {
        console.log(service + " " + channel + " went online.");

        onlineChannels[service].push(channel);
    }
}

function WentOffline(service, channel) {
    if (!onlineChannels.hasOwnProperty(service)) {
        onlineChannels[service] = [];
    }

    var index = onlineChannels[service].indexOf(channel);

    if (index > -1) {
        console.log(service + " " + channel + " went offline.");

        onlineChannels[service].splice(1, index);
    }
}

function GetStats(channelObj) {
    var service = channelObj.service;
    var channel = channelObj.channel;

    switch (service) {
        case 'klpq':
            GetKlpqStats(channel);
            break;
        case 'twitch':
            GetTwitchStats(channel);
            break;
        default:
            break;
    }
}

function GetKlpqStats(channel) {
    let service = 'klpq';
    var url = "http://stats.klpq.men/channel/" + channel;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.isLive) {
                    console.log(service + " " + channel + " is online.");

                    WentOnline(service, channel);
                } else {
                    console.log(service + " " + channel + " is offline.");

                    WentOffline(service, channel);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    })
}

function GetTwitchStats(channel) {
    let service = 'twitch';
    var url = "https://api.twitch.tv/kraken/streams?channel=" + channel + "&client_id=" + twitchApiKey;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.streams.length > 0) {
                    console.log(service + " " + channel + " is online.");

                    WentOnline(service, channel);
                } else {
                    console.log(service + " " + channel + " is offline.");

                    WentOffline(service, channel);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    })
}

ChannelCheck.prototype.GetStats = GetStats;

module.exports = ChannelCheck;
