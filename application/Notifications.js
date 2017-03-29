/**
 * Created by rebel on 27/03/2017.
 */

const {Menu} = require('electron');
const {app} = require('electron');
const path = require('path');
const request = require('request');
const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

let appIcon = null;
let contextMenuTemplate = [];

function takeRef(appIconRef, contextMenuTemplateRef) {
    appIcon = appIconRef;
    contextMenuTemplate = contextMenuTemplateRef;
}

function printNotification(title, content) {
    let settingsJson = SettingsFile.returnSettings();

    if (!settingsJson.settings.showNotificaions)
        return;

    appIcon.title = title;
    appIcon.content = content;

    appIcon.displayBalloon({
        icon: appIcon.iconPath,
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
    let settingsJson = SettingsFile.returnSettings();

    console.log('balloon was clicked.');

    if (!settingsJson.settings.launchOnBalloonClick)
        return;

    if (appIcon.title == 'Stream is Live') {
        ChannelPlay.launchPlayerLink(appIcon.content);
    }
}

function rebuildIconMenu(onlineChannels = []) {
    contextMenuTemplate[1].submenu = onlineChannels.map(function (channelLink) {
        return {
            label: channelLink, type: 'normal', click: (menuItem) => {
                ChannelPlay.launchPlayerLink(menuItem.label);
            }
        }
    });

    let contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

    appIcon.setContextMenu(contextMenu);
}

exports.takeRef = takeRef;
exports.printNotification = printNotification;
exports.onBalloonClick = onBalloonClick;
exports.rebuildIconMenu = rebuildIconMenu;
