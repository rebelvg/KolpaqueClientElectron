/**
 * Created by rebel on 21/03/2017.
 */

const {app} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const Notifications = require('./Notifications');

let settingsPath = path.normalize(app.getPath('documents') + '/KolpaqueClient.json');
let settingsJson = {};
let preInstalledChannels = ['rtmp://stream.klpq.men/live/main', 'rtmp://stream.klpq.men/live/klpq', 'rtmp://stream.klpq.men/live/murshun'];

function SettingsFile() {
}

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

function saveFile() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4));
    }
    catch (e) {
        console.log(e);
    }
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

function addChannel(channelLink) {
    channelLink = channelLink.replace(/\s+/g, '').toLowerCase();

    if (channelLink.length == 0)
        return false;

    if (settingsJson.channels.hasOwnProperty(channelLink))
        return false;

    let channelService = "custom";

    if (channelLink.indexOf('rtmp') != 0 && channelLink.indexOf('http') != 0)
        return false;

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

    new Notifications().rebuildIconMenu();

    return true;
}

function changeSetting(settingName, settingValue) {
    settingsJson.settings[settingName] = settingValue;
}

function returnSettings() {
    return settingsJson;
}

SettingsFile.prototype.saveFile = saveFile;
SettingsFile.prototype.readFile = readFile;
SettingsFile.prototype.addChannel = addChannel;
SettingsFile.prototype.removeChannel = removeChannel;
SettingsFile.prototype.changeSetting = changeSetting;
SettingsFile.prototype.returnSettings = returnSettings;

module.exports = SettingsFile;
