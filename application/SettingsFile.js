/**
 * Created by rebel on 21/03/2017.
 */

const {app, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const Notifications = require('./Notifications');
const {allowedProtocols, registeredServices, preInstalledChannels, buildChannelObj} = require('./Globals');
const Channel = require('./ChannelClass');
const Config = require('./ConfigClass');
const ChannelCheck = require('./ChannelCheck');

let config = new Config();

ipcMain.on('change-setting', (event, setting) => {
    return config.changeSetting(setting.name, setting.value);
});

ipcMain.on('add-channel', (event, channel) => {
    let channelObj = config.addChannelLink(channel.link);

    if (channelObj === false) {
        return false;
    }

    return event.sender.send('add-channel-response', {status: true, channel: channelObj});
});

ipcMain.on('remove-channel', (event, channelLink) => {
    let res = config.removeChannelLink(channelLink);

    return event.sender.send('remove-channel-response', {status: res, channelLink: channelLink});
});

function saveFile() {
    return config.saveFile();
}

function addChannel(channelLink, printError = true) {
    return config.addChannelLink(channelLink);
}

config.on('channel_removed', (channelObj) => {
    let onlineChannels = ChannelCheck.onlineChannels;

    delete onlineChannels[channelObj.link];

    Notifications.rebuildIconMenu(Object.keys(onlineChannels));
});

function removeChannel(channelLink) {
    return config.removeChannelLink(channelLink);
}

function returnChannels() {
    return config.channels;
}

function returnChannelsLegacy() {
    let legacyChannels = {};

    _.forEach(config.channels, (channelObj) => {
        legacyChannels[channelObj.link] = channelObj;
    });

    return legacyChannels;
}

exports.saveFile = saveFile;
exports.addChannel = addChannel;
exports.removeChannel = removeChannel;
exports.returnChannels = returnChannels;
exports.returnChannelsLegacy = returnChannelsLegacy;
exports.settingsJson = config;
