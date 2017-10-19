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

    if (settingName === 'visibleName') {
        if (!settingValue) {
            settingValue = channelObj.name;
        }
    }

    return channelObj.changeSetting(settingName, settingValue);
});

ipcMain.on('config_getTheme', (event) => {
    event.returnValue = config.getTheme();
});

ipcMain.on('config_setTheme', (event, themeObj) => {
    event.returnValue = config.setTheme(themeObj);
});

ipcMain.once('getChannels', (event) => (event.returnValue = config.channels));

ipcMain.once('getSettings', (event) => (event.returnValue = config.settings));

function saveFile() {
    return config.saveFile();
}

function addChannel(channelLink) {
    return config.addChannelLink(channelLink);
}

exports.saveFile = saveFile;
exports.addChannel = addChannel;
exports.settingsJson = config;
