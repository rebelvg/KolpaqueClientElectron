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
    let link = channelObj.link;
    let quality = "best";

    if (link.startsWith("rtmp")) {
        link += " live=1";
    }

    let path = clientSettings.livestreamerPath;

    if (fs.existsSync(path)) {
        var child = require('child_process').execFile;

        console.log('launching player for ' + link);

        child(path, [link, quality], function (err, data) {
            //console.log(err);
            //console.log(data.toString());
            console.log('player was closed.');
        });
    } else {
        console.log(path + " not found.");
    }
}

ChannelPlay.prototype.launchPlayer = launchPlayer;

module.exports = ChannelPlay;
