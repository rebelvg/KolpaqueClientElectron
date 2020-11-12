import { app, Menu, nativeImage, MenuItem } from 'electron';
import * as _ from 'lodash';

import { config } from './settings-file';
import { registeredServices } from './Globals';
import { contextMenuTemplate } from './main';

config.on('setting_changed', (settingName, settingValue) => {
  if (settingName === 'showNotifications') {
    contextMenuTemplate[3].checked = settingValue;
  }
});

export function rebuildIconMenu() {
  const onlineChannels = config.find({
    isLive: true,
  }).channels;

  contextMenuTemplate[1]['submenu'] = onlineChannels.map(channelObj => {
    if (!channelObj._trayIcon) {
      const iconBuffer = channelObj._icon
        ? channelObj._icon
        : registeredServices[channelObj.service].icon;

      if (iconBuffer) {
        channelObj._trayIcon = nativeImage
          .createFromBuffer(iconBuffer)
          .resize({ height: 16 });
      }
    }

    return {
      label: !config.settings.LQ
        ? channelObj.visibleName
        : `${channelObj.visibleName} (LQ)`,
      type: 'normal',
      click: (menuItem, browserWindow, event) => {
        channelObj.emit('play', event.ctrlKey, event.shiftKey ? true : null);
      },
      icon: channelObj._trayIcon,
    };
  });

  return Menu.buildFromTemplate(contextMenuTemplate as any);
}
