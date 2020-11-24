import { Menu, nativeImage } from 'electron';
import * as _ from 'lodash';

import { config } from './settings-file';
import { contextMenuTemplate } from './main';
import { Channel } from './channel-class';

config.on('setting_changed', (settingName, settingValue) => {
  if (settingName === 'showNotifications') {
    contextMenuTemplate[3].checked = settingValue;
  }
});

export function rebuildIconMenu() {
  const onlineChannels = config.find({
    isLive: true,
  }).channels;

  contextMenuTemplate[1]['submenu'] = onlineChannels.map(
    (channelObj: Channel) => {
      if (!channelObj._trayIcon) {
        const iconBuffer = channelObj._icon
          ? channelObj._icon
          : channelObj.serviceObj.icon;

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
    },
  );

  return Menu.buildFromTemplate(contextMenuTemplate as any);
}