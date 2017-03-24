/**
 * Created by rebel on 22/03/2017.
 */

const fs = require('fs');
const SettingsFile = require('./SettingsFile');

let settingsJson = new SettingsFile().returnSettings();
let clientChannels = settingsJson.channels;
let clientSettings = settingsJson.settings;

function ChannelPlay() {
}

function launchPlayer(channelObj) {
    let channelLink = channelObj.link;

    launchPlayerLink(channelLink);
}

function launchPlayerLink(channelLink) {
    let quality = "best";

    if (channelLink.startsWith("rtmp")) {
        channelLink += " live=1";
    }

    let path = clientSettings.livestreamerPath;

    if (fs.existsSync(path)) {
        var child = require('child_process').execFile;

        console.log('launching player for ' + channelLink);

        child(path, [channelLink, quality], function (err, data) {
            //console.log(err);
            //console.log(data.toString());
            console.log('player was closed.');
        });
    } else {
        console.log(path + " not found.");
    }
}

ChannelPlay.prototype.launchPlayer = launchPlayer;
ChannelPlay.prototype.launchPlayerLink = launchPlayerLink;

module.exports = ChannelPlay;
