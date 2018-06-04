const {app, BrowserWindow, ipcMain, shell, clipboard, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const {allowedProtocols, registeredServices, preInstalledChannels} = require('./Globals');
const Config = require('./ConfigClass');

let config = new Config();

ipcMain.on('config_changeSetting', (event, settingName, settingValue) => {
    if (settingName === 'twitchImport') {
        settingValue = _.uniq(settingValue);
    }

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

    if (!channelObj) return false;

    if (settingName === 'visibleName') {
        if (!settingValue) {
            settingValue = channelObj.name;
        }
    }

    return channelObj.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_changeSettingSync', (event, id, settingName, settingValue) => {
    let channelObj = config.findById(id);

    if (!channelObj) return event.returnValue = false;

    if (settingName === 'visibleName') {
        if (!settingValue) {
            settingValue = channelObj.name;
        }
    }

    return event.returnValue = channelObj.changeSetting(settingName, settingValue);
});

ipcMain.on('channel_openPage', (event, id) => {
    let channelObj = config.findById(id);

    if (channelObj === null) return false;

    if (channelObj.serviceObj.embed) {
        shell.openExternal(channelObj.serviceObj.embed(channelObj));
    } else {
        if (['http:', 'https:'].includes(channelObj.protocol)) {
            shell.openExternal(channelObj.link);
        }
    }

    return true;
});

ipcMain.on('channel_openChat', (event, id) => {
    let channelObj = config.findById(id);

    if (channelObj === null) return false;

    let link;
    let window;

    if (channelObj.serviceObj.chat) {
        link = channelObj.serviceObj.chat(channelObj);
    } else {
        if (['http:', 'https:'].includes(channelObj.protocol)) {
            link = `${channelObj.link}/chat`;
        }
    }

    if (link) {
        if (config.settings.playInWindow) {
            window = new BrowserWindow({
                width: 405,
                height: 720,
                webPreferences: {
                    nodeIntegration: false,
                }
            });

            window.loadURL(link);

            window.on('closed', () => {
                window = null;
            });

            app.mainWindow.on('closed', () => {
                if (window) {
                    window.close();
                }
            });
        } else {
            shell.openExternal(link);
        }
    }

    return true;
});

ipcMain.on('channel_copyClipboard', (event, channelLink) => {
    clipboard.writeText(channelLink);

    return true;
});

ipcMain.once('getChannels', (event) => event.returnValue = config.channels);

ipcMain.once('getSettings', (event) => event.returnValue = config.settings);

ipcMain.on('getSettingSync', (event, settingName) => {
    if (!config.settings.hasOwnProperty(settingName))
        return event.returnValue = null;

    return event.returnValue = config.settings[settingName];
});

ipcMain.on('config_find', (event, query) => {
    const find = config.find(query);

    find.channels = _.map(find.channels, channel => {
        return {
            id: channel.id,
            service: channel.service,
            name: channel.name,
            link: channel.link,
            protocol: channel.protocol,
            isLive: channel.isLive,
            onAutoRestart: channel.onAutoRestart,
            lastUpdated: channel.lastUpdated,

            visibleName: channel.visibleName,
            isPinned: channel.isPinned,
            autoStart: channel.autoStart,
            autoRestart: channel.autoRestart
        };
    });

    return event.returnValue = find;
});

module.exports = config;
