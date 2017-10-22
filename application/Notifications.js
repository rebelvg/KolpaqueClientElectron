/**
 * Created by rebel on 27/03/2017.
 */

const {app, shell, Menu, Notification} = require('electron');

const config = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

function printNotification(title, content, channelObj = {}) {
    if (!config.settings.showNotifications)
        return;

    printNewNotification(title, content, channelObj);
}

function printNewNotification(title, content, channelObj = {}) {
    let icon = app.appIcon.iconPathBalloon;

    if (channelObj._icon) {
        icon = channelObj._icon;
    }

    let notification = new Notification({
        icon: icon,
        title: title,
        body: content
    });

    notification.on('click', function (event) {
        onBalloonClick(title, content, channelObj);
    });

    notification.show();
}

function onBalloonClick(title, content, channelObj) {
    console.log('balloon was clicked.');

    if (!config.settings.launchOnBalloonClick)
        return;

    if (title.indexOf('Stream is Live') === 0) {
        ChannelPlay.launchPlayerObj(channelObj);
    }

    if (title.includes('Update Available')) {
        shell.openExternal(content);
    }
}

exports.printNotification = printNotification;
