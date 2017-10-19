const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const EventEmitter = require('events');

const {allowedProtocols, registeredServices, preInstalledChannels, buildChannelObj} = require('./Globals');
const Channel = require('./ChannelClass');
const ChannelCheck = require('./ChannelCheck');
const isDev = process.env.NODE_ENV === 'dev';

const settingsPath = path.normalize(path.join(app.getPath('documents'), isDev ? 'KolpaqueClient_dev.json' : 'KolpaqueClient.json'));
const channelSave = ['link', 'visibleName', 'isPinned', 'autoStart', 'autoRestart'];

function readFile(config) {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        let parseJson = JSON.parse(file);

        _.forEach(parseJson.channels, (channelObj) => {
            let channel = config.addChannelLink(channelObj.link);

            if (channel !== false) {
                channel.update(channelObj);
            }
        });

        _.forEach(config.settings, (settingValue, settingName) => {
            if (parseJson.settings.hasOwnProperty(settingName)) {
                config.settings[settingName] = parseJson.settings[settingName];
            }
        });

        if (parseJson.theme) {
            config.theme = parseJson.theme;
        }
    }
    catch (e) {
        console.log(e.stack);

        _.forEach(preInstalledChannels, (channelLink) => {
            config.addChannelLink(channelLink);
        });
    }
}

function saveLoop(config) {
    setInterval(() => {
        config.saveFile();
    }, 5 * 60 * 1000);
}

class Config extends EventEmitter {
    constructor() {
        super();

        this.channels = [];
        this.settings = {
            LQ: false,
            showNotifications: true,
            minimizeAtStart: false,
            launchOnBalloonClick: true,
            width: 400,
            height: 900,
            youtubeApiKey: null,
            twitchImport: []
        };
        this.theme = null;

        readFile(this);

        saveLoop(this);

        this.on('channel_added', (channelObj) => {
            app.mainWindow.webContents.send('channel_add', channelObj);

            ChannelCheck.checkChannel(channelObj);
        });

        this.on('channel_removed', (channelObj) => {
            app.mainWindow.webContents.send('channel_remove', channelObj.id);
        });
    }

    addChannelLink(channelLink) {
        let channelObj = buildChannelObj(channelLink);

        if (channelObj === false) {
            return false;
        }

        let res = this.findChannelByLink(channelObj.link);

        if (res !== null) {
            return false;
        }

        this.channels.push(channelObj);

        this.emit('channel_added', channelObj);

        return channelObj;
    }

    removeChannelById(id) {
        let channelObj = this.findById(id);

        if (!this.channels.includes(channelObj)) {
            return true;
        }

        _.pull(this.channels, channelObj);

        this.emit('channel_removed', channelObj);

        return true;
    }

    changeSetting(settingName, settingValue) {
        if (!this.settings.hasOwnProperty(settingName)) {
            return false;
        }

        this.settings[settingName] = settingValue;

        this.emit('setting_changed', settingName, settingValue);

        return true;
    }

    getTheme() {
        return this.theme;
    }

    setTheme(themeObj) {
        this.theme = themeObj;

        return true;
    }

    findById(id) {
        let channel = this.channels.find((channel) => {
            return channel.id === id;
        });

        if (!channel) {
            return null;
        }

        return channel;
    }

    findChannelByLink(channelLink) {
        let channel = this.channels.find((channel) => {
            return channel.link === channelLink;
        });

        if (!channel) {
            return null;
        }

        return channel;
    }

    saveFile() {
        try {
            let saveConfig = {};

            saveConfig.channels = _.map(this.channels, (channelObj) => {
                let channel = {};

                _.forEach(channelSave, (settingName) => {
                    if (channelObj.hasOwnProperty(settingName)) {
                        channel[settingName] = channelObj[settingName];
                    }
                });

                return channel;
            });

            saveConfig.settings = this.settings;
            saveConfig.theme = this.theme;

            fs.writeFileSync(settingsPath, JSON.stringify(saveConfig, null, 4));

            console.log('settings saved.');

            return true;
        }
        catch (e) {
            console.log(e.message);

            return false;
        }
    }
}

module.exports = Config;
