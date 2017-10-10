/**
 * Created by rebel on 27/03/2017.
 */

const {app, shell, Menu, Notification} = require('electron');
const path = require('path');
const request = require('request');

const SettingsFile = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

function printNotification(title, content) {
    let settingsJson = SettingsFile.settingsJson;

    if (!settingsJson.settings.showNotifications)
        return;

    printNewNotification(title, content);
}

function printNewNotification(title, content) {
    let notification = new Notification({
        icon: app.appIcon.iconPathBalloon,
        title: title,
        body: content
    });

    notification.on('click', function (event) {
        onBalloonClick(title, content);
    });

    notification.show();
}

function onBalloonClick(title, content) {
    let settingsJson = SettingsFile.settingsJson;

    console.log('balloon was clicked.');

    if (!settingsJson.settings.launchOnBalloonClick)
        return;

    if (title.indexOf('Stream is Live') === 0) {
        let channelObj = settingsJson.findChannelByLink(content);

        if (channelObj) {
            ChannelPlay.launchPlayerObj(channelObj);
        }
    }

    if (title.indexOf('Client Update Available') === 0) {
        shell.openExternal(content);
    }

    if (title.indexOf('Streamlink Update Available') === 0) {
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
                ChannelPlay.launchPlayerObj(channelObj, event.ctrlKey ? true : null, event.shiftKey ? true : null);
            }
        }
    });

    let contextMenu = Menu.buildFromTemplate(app.contextMenuTemplate);

    app.appIcon.setContextMenu(contextMenu);
}

exports.printNotification = printNotification;
exports.onBalloonClick = onBalloonClick;
exports.rebuildIconMenu = rebuildIconMenu;
