/**
 * Created by rebel on 22/03/2017.
 */

const fs = require('fs');
const SettingsFile = require('./SettingsFile');

function ChannelPlay() {
}

function launchPlayer(channelObj, LQ = null) {
    let channelLink = channelObj.link;

    launchPlayerLink(channelLink, LQ);
}

function launchPlayerLink(channelLink, LQ = null) {
    let settingsJson = new SettingsFile().returnSettings();

    let quality = 'best';

    if (LQ == null)
        LQ = settingsJson.settings.LQ;

    if (channelLink.startsWith("rtmp")) {
        channelLink += " live=1";

        if (LQ && channelLink.indexOf('klpq.men/live/') >= 0) {
            console.log('live to restream');
            channelLink = channelLink.replace('/live/', '/restream/');
        }
    } else {
        if (LQ)
            quality = 'high';
    }

    let path = settingsJson.settings.livestreamerPath;

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