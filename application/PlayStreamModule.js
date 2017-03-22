/**
 * Created by rebel on 22/03/2017.
 */

const fs = require('fs');
const SettingsReader = require('./SettingsReader');
let SettingsFile = new SettingsReader().ReturnSettings();

function PlayStream() {
}

function LaunchPlayer(channelObj) {
    let link = channelObj.link;
    let quality = "best";

    if (link.startsWith("rtmp")) {
        link += " live=1";
    }

    let path = SettingsFile.settings.livestreamerPath;

    if (fs.existsSync(path)) {
        var child = require('child_process').execFile;

        console.log('launching player for ' + link);

        child(path, [link, quality], function (err, data) {
            console.log(err);
            console.log(data.toString());
        });
    } else {
        console.log(path + " not found.");
    }
}

PlayStream.prototype.LaunchPlayer = LaunchPlayer;

module.exports = PlayStream;
