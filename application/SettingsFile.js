/**
 * Created by rebel on 21/03/2017.
 */

const {app} = require('electron');
const {ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const Notifications = require('./Notifications');
const dialog = require('electron').dialog;

let settingsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.json'));
let settingsJson = {};
let preInstalledChannels = ['rtmp://stream.klpq.men/live/main'];

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

function createSettings() {
    settingsJson.channels = {};
    settingsJson.settings = {};

    settingsJson.settings.livestreamerPath = "C:\\Program Files (x86)\\Streamlink\\bin\\streamlink.exe";
    settingsJson.settings.LQ = false;
    settingsJson.settings.showNotificaions = true;
    settingsJson.settings.autoPlay = false;
    settingsJson.settings.minimizeAtStart = false;
    settingsJson.settings.launchOnBalloonClick = true;
    settingsJson.settings.enableLog = false;
    settingsJson.settings.theme = "light";

    preInstalledChannels.forEach(addChannel);

    return settingsJson;
}

function readFile() {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        try {
            settingsJson = JSON.parse(file);
            return settingsJson;
        } catch (e) {
            console.log(e);
            return createSettings();
        }
    }
    catch (e) {
        console.log(e);
        return createSettings();
    }
}

function saveFile() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4));
        console.log('settings saved.');
    }
    catch (e) {
        console.log(e);
    }
}

function addChannel(channelLink) {
    channelLink = channelLink.replace(/\s+/g, '').toLowerCase();

    if (channelLink.length == 0)
        return false;

    if (settingsJson.channels.hasOwnProperty(channelLink))
        return false;

    let channelService = "custom";

    if (channelLink.indexOf('rtmp') != 0 && channelLink.indexOf('http') != 0) {
        dialog.showMessageBox({
            type: 'error',
            message: 'Channels should start with rtmp or http.'
        });
        return false;
    }

    if (channelLink.includes('klpq.men/live/')) {
        channelService = 'klpq';
    }

    if (channelLink.includes('twitch.tv/')) {
        channelService = 'twitch';
    }

    console.log(channelService);

    let array = channelLink.split('/');

    if (array.length < 2)
        return false;

    let channelName = array[array.length - 1];

    console.log(channelName);

    if (channelName.length == 0)
        return false;

    let channelObj = {};

    channelObj[channelLink] = {
        'service': channelService,
        'name': channelName,
        'link': channelLink
    };

    _.extend(settingsJson.channels, channelObj);

    return channelObj[channelLink];
}

function removeChannel(channelLink) {
    if (!settingsJson.channels.hasOwnProperty(channelLink))
        return true;

    if (preInstalledChannels.indexOf(channelLink) >= 0)
        return false;

    delete settingsJson.channels[channelLink];

    Notifications.rebuildIconMenu();

    return true;
}

function saveLoop() {
    setInterval(saveFile, 5 * 60 * 1000);
}

function changeSetting(settingName, settingValue) {
    settingsJson.settings[settingName] = settingValue;
}

function returnSettings() {
    return settingsJson;
}

exports.readFile = readFile;
exports.saveFile = saveFile;
exports.addChannel = addChannel;
exports.removeChannel = removeChannel;
exports.changeSetting = changeSetting;
exports.returnSettings = returnSettings;
exports.saveLoop = saveLoop;
