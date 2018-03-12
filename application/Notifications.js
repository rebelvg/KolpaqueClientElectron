/**
 * Created by rebel on 27/03/2017.
 */

const {app, shell, Menu, Notification, nativeImage} = require('electron');
const _ = require('lodash');

const config = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');
const Logger = require('./Logger');
const Globals = require('./Globals');

function printNotification(title, content, channelObj = null) {
    if (!config.settings.showNotifications)
        return;

    printNewNotification(title, content, channelObj);
}

function printNewNotification(title, content, channelObj) {
    let icon = app.appIcon.iconPathBalloon;

    Logger(title, content);

    if (channelObj) {
        if (channelObj._icon) {
            icon = nativeImage.createFromBuffer(channelObj._icon);

            Logger(channelObj._icon.length, icon.isEmpty(), icon.constructor.name, icon.toPNG().length);
        } else {
            const serviceIcon = Globals.registeredServices[channelObj.service].icon;

            if (serviceIcon) icon = nativeImage.createFromBuffer(serviceIcon);
        }
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
