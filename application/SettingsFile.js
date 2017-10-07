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

ipcMain.on('config_changeSetting', (event, settingName, settingValue) => {
    return config.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_add', (event, channelLink) => {
    return config.addChannelLink(channelLink);
});

ipcMain.on('channel_remove', (event, id) => {
    return config.removeChannelById(id);
});

ipcMain.on('channel_changeSetting', (event, id, settingName, settingValue) => {
    let channelObj = config.findById(id);

    if (!channelObj) {
        return false;
    }

    channelObj.changeSetting(settingName, settingValue);
});

ipcMain.once('getChannels', (event) => (event.returnValue = returnChannels()));

ipcMain.once('getSettings', (event) => (event.returnValue = config.settings));

function saveFile() {
    return config.saveFile();
}

function addChannel(channelLink) {
    return config.addChannelLink(channelLink);
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
exports.returnChannelsLegacy = returnChannelsLegacy;
exports.settingsJson = config;
