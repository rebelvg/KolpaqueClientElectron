/**
 * Created by rebel on 27/03/2017.
 */

const {app, shell, Menu, Notification} = require('electron');
const path = require('path');
const request = require('request');

const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

function printNotification(title, content, channelObj = {}) {
    let settingsJson = SettingsFile.settingsJson;

    if (!settingsJson.settings.showNotifications)
        return;

    printNewNotification(title, content, channelObj);
}

function printNewNotification(title, content, channelObj = {}) {
    let notification = new Notification({
        icon: app.appIcon.iconPathBalloon,
        title: title,
        body: content
    });

    notification.on('click', function (event) {
        onBalloonClick(title, content, channelObj);
    });

    notification.show();
}

function onBalloonClick(title, content, channelObj) {
    let settingsJson = SettingsFile.settingsJson;

    console.log('balloon was clicked.');

    if (!settingsJson.settings.launchOnBalloonClick)
        return;

    if (title.indexOf('Stream is Live') === 0) {
        ChannelPlay.launchPlayerObj(channelObj);
    }

    if (title.includes('Update Available')) {
        shell.openExternal(content);
    }
}

function rebuildIconMenu() {
    let onlineChannels = SettingsFile.settingsJson.channels.filter((channelObj) => {
        return channelObj.isLive;
    });

    app.contextMenuTemplate[1].submenu = onlineChannels.map(function (channelObj) {
        return {
            label: channelObj.visibleName, type: 'normal', click: (menuItem, browserWindow, event) => {
                ChannelPlay.launchPlayerObj(channelObj, event.ctrlKey, event.shiftKey ? true : null);
            }
        }
    });

    let contextMenu = Menu.buildFromTemplate(app.contextMenuTemplate);

    app.appIcon.setContextMenu(contextMenu);
}

exports.printNotification = printNotification;
exports.rebuildIconMenu = rebuildIconMenu;
