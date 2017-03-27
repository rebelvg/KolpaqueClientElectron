/**
 * Created by rebel on 27/03/2017.
 */

const {Menu} = require('electron');
const request = require('request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

let appIcon = null;
let contextMenuTemplate = [];

function Notifications() {
}

function takeIconReference(appIconRef, contentMenuTemplateRef) {
    appIcon = appIconRef;
    contextMenuTemplate = contentMenuTemplateRef;
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

    setTimeout(function (title, content) {
        if (title != appIcon.title || content != appIcon.content)
            return;

        console.log('closing balloon');

        appIcon.displayBalloon({
            title: '',
            content: ''
        });
    }, 10000, title, content);
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

function rebuildIconMenu(onlineChannels) {
    contextMenuTemplate[1].submenu = onlineChannels.map(function (channelLink) {
        return {
            label: channelLink, type: 'normal', click: (menuItem) => {
                const ChannelPlay = require('./ChannelPlay');

                new ChannelPlay().launchPlayerLink(menuItem.label);
            }
        }
    });

    let contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

    appIcon.setContextMenu(contextMenu);
}

Notifications.prototype.takeIconReference = takeIconReference;
Notifications.prototype.printNotification = printNotification;
Notifications.prototype.onBalloonClick = onBalloonClick;
Notifications.prototype.rebuildIconMenu = rebuildIconMenu;

module.exports = Notifications;
