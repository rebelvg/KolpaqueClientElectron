/**
 * Created by rebel on 21/03/2017.
 */

const {app} = require('electron');
const fs = require('fs');
let settingsPath = app.getPath('documents') + '\\KolpaqueClient.json';
let settingsJson = {};

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

    return settingsJson;
}

function SaveFile() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4));
        console.log("The file was saved!");
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

FileReader.prototype.SaveFile = SaveFile;
FileReader.prototype.ReadFile = ReadFile;

module.exports = FileReader;
