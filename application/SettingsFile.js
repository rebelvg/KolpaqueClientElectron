/**
 * Created by rebel on 21/03/2017.
 */

const {app, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const Notifications = require('./Notifications');
const {allowedProtocols, registeredServices, Channel} = require('./ChannelClass');

let settingsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.json'));
let settingsJson = {};

const preInstalledChannels = ['rtmp://vps.klpq.men/live/main', 'rtmp://main.klpq.men/live/main'];

ipcMain.on('change-setting', (event, setting) => {
    changeSetting(setting.name, setting.value);

    console.log('setting ' + setting.name + ' changed to ' + setting.value);
});

ipcMain.on('add-channel', (event, channel) => {
    let channelObj = addChannel(channel.link);

    if (channelObj === false) {
        event.sender.send('add-channel-response', {status: false});
        return;
    }

    console.log('channel ' + channelObj.name + ' was added');

    event.sender.send('add-channel-response', {status: true, channel: channelObj});
});

ipcMain.on('remove-channel', (event, channel) => {
    let result = removeChannel(channel);

    event.sender.send('remove-channel-response', {status: result, channelLink: channel});
});

let defaultSettings = {
    channels: {},
    settings: {
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
    }
};

function readFile() {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        let parseJson = JSON.parse(file);

        settingsJson.channels = {};
        settingsJson.settings = defaultSettings.settings;

        let serviceSorting = {};

        _.forEach(registeredServices, function (serviceObj, serviceName) {
            serviceSorting[serviceName] = [];
        });

        _.forEach(parseJson.channels, function (channelObj, channelLink) {
            channelObj = buildChannelObj(channelLink);

            if (channelObj !== false) {
                serviceSorting[channelObj.service].push(channelObj);
            }
        });

        _.forEach(serviceSorting, function (channels) {
            _.forEach(channels, function (channelObj) {
                settingsJson.channels[channelObj.link] = channelObj;
            });
        });

        _.forEach(defaultSettings.settings, function (value, key) {
            if (parseJson.settings.hasOwnProperty(key)) {
                settingsJson.settings[key] = parseJson.settings[key];
            }
        });

        return settingsJson;
    }
    catch (e) {
        console.log(e.message);

        settingsJson.channels = {};
        settingsJson.settings = defaultSettings.settings;

        preInstalledChannels.forEach(addChannel);

        return settingsJson;
    }
}

function saveFile() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4));
        console.log('settings saved.');
    }
    catch (e) {
        console.log(e.message);
    }
}

function buildChannelObj(channelLink) {
    try {
        return new Channel(channelLink);
    }
    catch (e) {
        console.log(e.message);
        return false;
    }
}

function addChannel(channelLink, printError = true) {
    channelLink = channelLink.replace(/\s+/g, '');

    try {
        let channelObj = buildChannelObj(channelLink);

        if (channelObj === false) {
            throw Error('Error adding channel.');
        }

        if (settingsJson.channels.hasOwnProperty(channelObj.link))
            return false;

        let channels = {};

        channels[channelObj.link] = channelObj;

        _.extend(settingsJson.channels, channels);

        console.log('added channel.', channelObj);

        return channelObj;
    }
    catch (e) {
        if (printError) {
            dialog.showMessageBox({
                type: 'error',
                message: e.message
            });
        }

        return false;
    }
}

function removeChannel(channelLink) {
    if (!settingsJson.channels.hasOwnProperty(channelLink))
        return true;

    delete settingsJson.channels[channelLink];

    let {onlineChannels} = require('./ChannelCheck');

    delete onlineChannels[channelLink];

    Notifications.rebuildIconMenu(Object.keys(onlineChannels));

    return true;
}

function saveLoop() {
    setInterval(saveFile, 5 * 60 * 1000);
}

function changeSetting(settingName, settingValue) {
    settingsJson.settings[settingName] = settingValue;
}

function returnChannels() {
    return _.map(settingsJson.channels, function (channelObj, channelLink) {
        return channelObj;
    })
}

function returnSettings() {
    return settingsJson;
}

exports.readFile = readFile;
exports.saveFile = saveFile;
exports.addChannel = addChannel;
exports.removeChannel = removeChannel;
exports.changeSetting = changeSetting;
exports.returnChannels = returnChannels;
exports.returnSettings = returnSettings;
exports.saveLoop = saveLoop;
exports.settingsJson = settingsJson;
exports.buildChannelObj = buildChannelObj;
exports.registeredServices = registeredServices;
