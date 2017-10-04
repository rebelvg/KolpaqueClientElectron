const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const EventEmitter = require('events');

const {allowedProtocols, registeredServices} = require('./Globals');
const Channel = require('./ChannelClass');
const {buildChannelObj} = require('./SettingsFile');

let settingsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient_dev.json'));

const preInstalledChannels = ['rtmp://vps.klpq.men/live/main', 'rtmp://main.klpq.men/live/main'];

function readFile(config) {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        let parseJson = JSON.parse(file);

        _.forEach(parseJson.channels, (channelObj) => {
            config.addChannelLink(channelObj.link);
        });

        _.forEach(config.settings, (settingValue, settingName) => {
            if (parseJson.settings.hasOwnProperty(settingName)) {
                config.settings[settingName] = parseJson.settings[settingName];
            }
        });
    }
    catch (e) {
        console.log(e.message);

        preInstalledChannels.forEach(config.addChannelLink);
    }
}

function saveLoop(config) {
    setInterval(config.saveFile, 5 * 60 * 1000);
}

function addChannel(config, channelObj) {
    config.channels.push(channelObj);

    console.log('added channel.', channelObj.link);

    config.emit('channel_added', channelObj);

    return channelObj;
}

class Config extends EventEmitter {
    constructor() {
        super();

        this.channels = [];
        this.settings = {
            LQ: false,
            showNotifications: true,
            autoPlay: false,
            minimizeAtStart: false,
            launchOnBalloonClick: true,
            enableLog: false,
            theme: "light",
            width: 400,
            height: 700,
            youtubeApiKey: null,
            twitchImport: []
        };

        readFile(this);

        saveLoop(this);
    }

    addChannelLink(channelLink) {
        let channelObj = buildChannelObj(channelLink);

        if (channelObj === false) {
            return false;
        }

        channelObj = this.findChannelByLink(channelObj.link);

        if (channelObj !== null) {
            return false;
        }

        addChannel(this, channelObj);

        return channelObj;
    }

    removeChannel(channelObj) {
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
            fs.writeFileSync(settingsPath, JSON.stringify(this, null, 4));

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
