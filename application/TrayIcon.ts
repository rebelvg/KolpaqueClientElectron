import { app, Menu, nativeImage } from 'electron';
import * as _ from 'lodash';

import { config } from './SettingsFile';
import { registeredServices } from './Globals';
import { Channel } from './ChannelClass';

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

config.on('setting_changed', (settingName, settingValue) => {
  if (settingName === 'showNotifications') {
    (app as any).contextMenuTemplate[3].checked = settingValue;
  }

  if (['LQ', 'sortType', 'sortReverse', 'showNotifications'].includes(settingName)) {
    rebuildIconMenu();
  }
});

_.forEach(config.channels, setChannelEvents);

config.on('channel_added', setChannelEvents);
config.on('channel_added_channels', async (channels: Channel[]) => {
  channels.forEach(channel => {
    setChannelEvents(channel);
  });
});
config.on('channel_removed', rebuildIconMenu);

export function rebuildIconMenu() {
  const onlineChannels = config.find({
    isLive: true
  }).channels;

  (app as any).contextMenuTemplate[1].submenu = onlineChannels.map(channelObj => {
    if (!channelObj._trayIcon) {
      const iconBuffer = channelObj._icon ? channelObj._icon : registeredServices[channelObj.service].icon;

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
