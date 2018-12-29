import { app, Menu, nativeImage } from 'electron';
const _ = require('lodash');

import { config } from './SettingsFile';
const Globals = require('./Globals');

function setChannelEvents(channelObj) {
  channelObj.on('setting_changed', (settingName, settingValue) => {
    if (['visibleName', 'isPinned'].includes(settingName)) {
      rebuildIconMenu();
    }
  });

  channelObj.on('settings_changed', (settingName, settingValue) => {
    rebuildIconMenu();
  });
}

config.on('setting_changed', function(settingName, settingValue) {
  if (settingName === 'showNotifications') {
    (app as any).contextMenuTemplate[4].checked = settingValue;
  }

  if (['LQ', 'sortType', 'sortReverse', 'showNotifications'].includes(settingName)) {
    rebuildIconMenu();
  }
});

_.forEach(config.channels, setChannelEvents);
config.on('channel_added', setChannelEvents);
config.on('channel_removed', rebuildIconMenu);

function rebuildIconMenu() {
  let onlineChannels = config.find({
    isLive: true
  }).channels;

  (app as any).contextMenuTemplate[1].submenu = onlineChannels.map(channelObj => {
    if (!channelObj._trayIcon) {
      let iconBuffer = channelObj._icon ? channelObj._icon : Globals.registeredServices[channelObj.service].icon;

      if (iconBuffer) {
        channelObj._trayIcon = nativeImage.createFromBuffer(iconBuffer).resize({ height: 16 });
      }
    }

    return {
      label: !config.settings.LQ ? channelObj.visibleName : `${channelObj.visibleName} (LQ)`,
      type: 'normal',
      click: (menuItem, browserWindow, event) => {
        channelObj.emit('play', event.ctrlKey, event.shiftKey ? true : null);
      },
      icon: channelObj._trayIcon
    };
  });

  let contextMenu = Menu.buildFromTemplate((app as any).contextMenuTemplate);

  (app as any).appIcon.setContextMenu(contextMenu);
}

exports.rebuildIconMenu = rebuildIconMenu;
