/**
 * Created by rebel on 21/03/2017.
 */

const {app} = require('electron');
const fs = require('fs');
let settingsPath = app.getPath('documents') + '\\KolpaqueClient.json';
let settingsJson = {};
var _ = require('underscore');

function FileReader() {
}

function CreateSettings() {
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

function SaveFile() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4));
    }
    catch (e) {
        console.log(e);
    }
}

function ReadFile() {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        try {
            settingsJson = JSON.parse(file);
            return settingsJson;
        } catch (e) {
            console.log(e);
            return CreateSettings();
        }
    }
    catch (e) {
        console.log(e);
        return CreateSettings();
    }
}

function addChannel(channelLink) {
    channelLink = channelLink.replace(/\s+/g, '').toLowerCase();

    if (channelLink.length == 0)
        return false;

    if (settingsJson.channels.hasOwnProperty(channelLink))
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

    _.extend(settingsJson.channels, channelObj);

    return channelObj[channelLink];
}

function ReturnSettings() {
    return settingsJson;
}

FileReader.prototype.SaveFile = SaveFile;
FileReader.prototype.ReadFile = ReadFile;
FileReader.prototype.addChannel = addChannel;
FileReader.prototype.ReturnSettings = ReturnSettings;

module.exports = FileReader;
