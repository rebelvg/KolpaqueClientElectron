/**
 * Created by rebel on 21/03/2017.
 */

const {app} = require('electron');
const fs = require('fs');
const _ = require('underscore');

let settingsPath = app.getPath('documents') + '\\KolpaqueClient.json';
let settingsJson = {};

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
    settingsJson.settings.theme = "Default";

    return settingsJson;
}

function saveFile(settingsJson) {
    try {
        console.log(settingsJson);
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
    let clientChannels = settingsJson.channels;

    channelLink = channelLink.replace(/\s+/g, '').toLowerCase();

    if (channelLink.length == 0)
        return false;

    if (clientChannels.hasOwnProperty(channelLink))
        return false;

    let channelService = "custom";

    if (channelLink.includes('klpq.men/live/')) {
        channelService = 'klpq';
    }

    if (channelLink.includes('twitch.tv/')) {
        channelService = 'twitch';
    }

    console.log(channelService);

    let array = channelLink.split('/');

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

    _.extend(clientChannels, channelObj);

    return channelObj[channelLink];
}

function returnSettings() {
    return settingsJson;
}

SettingsFile.prototype.saveFile = saveFile;
SettingsFile.prototype.readFile = readFile;
SettingsFile.prototype.addChannel = addChannel;
SettingsFile.prototype.returnSettings = returnSettings;

module.exports = SettingsFile;
