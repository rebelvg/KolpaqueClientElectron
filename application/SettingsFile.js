/**
 * Created by rebel on 21/03/2017.
 */

const {app, ipcMain, shell, clipboard, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const {allowedProtocols, registeredServices, preInstalledChannels, buildChannelObj} = require('./Globals');
const Config = require('./ConfigClass');

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


ipcMain.on('channel_openPage', (event, id) => {
    let channelObj = config.findById(id);

    if (channelObj === null) {
        return false;
    }

    if (channelObj.protocol === 'rtmp:') {
        switch (channelObj.service) {
            case 'klpq-vps': {
                shell.openExternal('http://stream.klpq.men/' + channelObj.name);
                break;
            }
        }
    }

    if (['http:', 'https:'].includes(channelObj.protocol)) {
        shell.openExternal(channelObj.link);
    }

    return true;
});

ipcMain.on('channel_openChat', (event, id) => {
    let channelObj = config.findById(id);

    if (channelObj === null) {
        return false;
    }

    if (channelObj.protocol === 'rtmp:') {
        switch (channelObj.service) {
            case 'klpq-vps': {
                shell.openExternal(`http://stream.klpq.men/chat`);
                break;
            }
        }
    }

    if (['http:', 'https:'].includes(channelObj.protocol)) {
        switch (channelObj.service) {
            case 'twitch': {
                shell.openExternal(`${channelObj.link}/chat`);
                break;
            }
        }
    }

    return true;
});

ipcMain.on('channel_copyClipboard', (event, channelLink) => {
    clipboard.writeText(channelLink);

    return true;
});

ipcMain.once('getChannels', (event) => (event.returnValue = config.channels));

ipcMain.once('getSettings', (event) => (event.returnValue = config.settings));

module.exports = config;
