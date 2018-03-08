const {app, shell, Menu, Notification, nativeImage} = require('electron');
const _ = require('lodash');

const config = require('./SettingsFile');
const ChannelPlay = require('./ChannelPlay');

function setChannelEvents(channelObj) {
    channelObj.on('setting_changed', (settingName, settingValue) => {
        if (['isLive', 'visibleName', '_icon', 'isPinned'].includes(settingName)) {
            rebuildIconMenu();
        }
    });
}

config.on('setting_changed', (settingName, settingValue) => {
    if (['sortType', 'sortReverse'].includes(settingName)) {
        rebuildIconMenu();
    }
});

_.forEach(config.channels, (channelObj) => {
    setChannelEvents(channelObj);
});

config.on('setting_changed', function (settingName, settingValue) {
    if (settingName === 'showNotifications') {
        app.contextMenuTemplate[4].checked = settingValue;
    }

    if (['showNotifications'].includes(settingName)) {
        rebuildIconMenu();
    }
});

config.on('channel_added', (channelObj) => {
    setChannelEvents(channelObj);
});

config.on('channel_removed', (channelObj) => {
    rebuildIconMenu();
});

function rebuildIconMenu() {
    let onlineChannels = config.find({
        isLive: true
    }).channels;

    _.forEach(onlineChannels, channelObj => {
        if (!channelObj._icon16 && channelObj._icon) channelObj._icon16 = nativeImage.createFromBuffer(channelObj._icon).resize({height: 16});
    });

    app.contextMenuTemplate[1].submenu = onlineChannels.map(channelObj => {
        return {
            label: channelObj.visibleName,
            type: 'normal',
            click: (menuItem, browserWindow, event) => {
                ChannelPlay.launchPlayerObj(channelObj, event.ctrlKey, event.shiftKey ? true : null);
            },
            icon: channelObj._icon16 || null
        }
    });

    let contextMenu = Menu.buildFromTemplate(app.contextMenuTemplate);

    app.appIcon.setContextMenu(contextMenu);
}

exports.rebuildIconMenu = rebuildIconMenu;
