/**
 * Created by rebel on 21/03/2017.
 */

const {ipcMain} = require('electron');
const request = require('request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Notifications = require('./Notifications');
const {dialog} = require('electron');
const moment = require('moment');

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';
let onlineChannels = [];
let mainWindow = null;

ipcMain.on('twitch-import', (event, channel) => {
    twitchImport(channel);
});

function wentOnline(channelObj, printBalloon) {
    let settingsJson = SettingsFile.returnSettings();

    let channelLink = channelObj.link;

    if (onlineChannels.indexOf(channelLink) > -1)
        return;

    console.log(channelLink + " went online.");

    onlineChannels.push(channelLink);

    mainWindow.webContents.send('channel-went-online', channelObj);

    if (printBalloon) {
        Notifications.printNotification('Stream is Live (' + moment().format('D/MMM, H:mm') + ')', channelObj.link);
    }

    if (settingsJson.settings.autoPlay) {
        ChannelPlay.launchPlayer(channelObj);
    }

    Notifications.rebuildIconMenu(onlineChannels);
}

function wentOffline(channelObj) {
    let channelLink = channelObj.link;

    var index = onlineChannels.indexOf(channelLink);

    if (index == -1)
        return;

    console.log(channelLink + " went offline.");

    onlineChannels.splice(index, 1);

    mainWindow.webContents.send('channel-went-offline', channelObj);

    Notifications.rebuildIconMenu(onlineChannels);
}

function getKlpqStats(channelObj, printBalloon) {
    let channelService = 'klpq';
    var url = "http://stats.klpq.men/channel/" + channelObj.name;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.isLive) {
                    wentOnline(channelObj, printBalloon);
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

function getTwitchStats(channelObj, printBalloon) {
    let channelService = 'twitch';
    var url = "https://api.twitch.tv/kraken/streams?channel=" + channelObj.name + "&client_id=" + twitchApiKey;

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                if (body.streams.length > 0) {
                    wentOnline(channelObj, printBalloon);
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

function getStats5(channelObj, printBalloon = true) {
    var channelService = channelObj.service;

    switch (channelService) {
        case 'klpq':
            getKlpqStats(channelObj, printBalloon);
            break;
    }
}

function getStats30(channelObj, printBalloon = true) {
    var channelService = channelObj.service;

    switch (channelService) {
        case 'twitch':
            getTwitchStats(channelObj, printBalloon);
            break;
        default:
            break;
    }
}

function twitchImport(twitchChannel) {
    twitchChannel = twitchChannel.replace(/\s+/g, '').toLowerCase();

    if (twitchChannel.length == 0)
        return false;

    var url = "https://api.twitch.tv/kraken/users/" + twitchChannel + "/follows/channels" + "?client_id=" + twitchApiKey + "&limit=100";

    request({url: url, json: true}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try {
                let channels = body.follows.reverse();

                let i = 0;
                channels.forEach(function (channel) {
                    let channelObj = SettingsFile.addChannel(channel.channel.url);

                    if (channelObj !== false) {
                        mainWindow.webContents.send('add-channel-response', {status: true, channel: channelObj});
                        i++;
                    }
                });

                dialog.showMessageBox({
                    type: 'info',
                    message: 'Import done. ' + i + ' channels added.'
                });
            }
            catch (e) {
                console.log(e);
            }
        } else {
            dialog.showMessageBox({
                type: 'error',
                message: 'Import error.'
            });
        }
    })
}

function checkLoop(mainWindowRef) {
    let settingsJson = SettingsFile.returnSettings();
    mainWindow = mainWindowRef;

    for (var channel in settingsJson.channels) {
        if (settingsJson.channels.hasOwnProperty(channel)) {
            let channelObj = settingsJson.channels[channel];

            getStats5(channelObj);
            getStats30(channelObj);
        }
    }

    setInterval(function () {
        for (var channel in settingsJson.channels) {
            if (settingsJson.channels.hasOwnProperty(channel)) {
                let channelObj = settingsJson.channels[channel];

                getStats5(channelObj);
            }
        }
    }, 5000);

    setInterval(function () {
        for (var channel in settingsJson.channels) {
            if (settingsJson.channels.hasOwnProperty(channel)) {
                let channelObj = settingsJson.channels[channel];

                getStats30(channelObj);
            }
        }
    }, 30000);
}

exports.twitchImport = twitchImport;
exports.checkLoop = checkLoop;
