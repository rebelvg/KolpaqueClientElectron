/**
 * Created by rebel on 27/03/2017.
 */

const request = require('request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

let appIcon = null;

function Notifications() {
}

function takeIconReference(appIconRef) {
    appIcon = appIconRef;
}

function printNotification(title, content) {
    let settingsJson = new SettingsFile().returnSettings();

    if (!settingsJson.settings.showNotificaions)
        return;

    if (appIcon == null)
        return;

    appIcon.title = title;
    appIcon.content = content;

    appIcon.displayBalloon({
        title: appIcon.title,
        content: appIcon.content
    });
}

function onBalloonClick() {
    let settingsJson = new SettingsFile().returnSettings();

    console.log('balloon was clicked.');

    if (!settingsJson.settings.launchOnBalloonClick)
        return;

    if (appIcon.title == 'Stream is Live') {
        new ChannelPlay().launchPlayerLink(appIcon.content);
    }
}

Notifications.prototype.takeIconReference = takeIconReference;
Notifications.prototype.printNotification = printNotification;
Notifications.prototype.onBalloonClick = onBalloonClick;

module.exports = Notifications;
