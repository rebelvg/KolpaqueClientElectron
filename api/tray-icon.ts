import { BrowserWindow, Menu, MenuItem, nativeImage } from 'electron';

import { config } from './settings-file';
import { contextMenuTemplate } from './main';
import { Channel } from './channel-class';

config.on('setting_changed', (settingName, settingValue) => {
  if (settingName === 'showNotifications') {
    contextMenuTemplate[3].checked = settingValue;
  }
});

export function rebuildIconMenu(): Menu {
  const onlineChannels = config.find({
    isLive: true,
  }).channels;

  contextMenuTemplate[1]['submenu'] = onlineChannels.map(
    (channelObj: Channel) => {
      if (!channelObj._trayIcon) {
        const iconBuffer = channelObj._icon
          ? channelObj._icon
          : channelObj.icon();

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
        click: (
          menuItem: MenuItem,
          browserWindow: BrowserWindow,
          event: any,
        ): void => {
          channelObj.emit('play', event.ctrlKey, event.shiftKey ? true : null);
        },
        icon: channelObj._trayIcon,
      };
    },
  );

  return Menu.buildFromTemplate(contextMenuTemplate as any);
}
