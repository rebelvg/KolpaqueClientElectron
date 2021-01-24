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

  contextMenuTemplate[1]['submenu'] = onlineChannels.map((channel: Channel) => {
    if (!channel._trayIcon) {
      const iconBuffer = channel._icon ? channel._icon : channel.icon();

      if (iconBuffer) {
        channel._trayIcon = nativeImage
          .createFromBuffer(iconBuffer)
          .resize({ height: 16 });
      }
    }

    return {
      label: !config.settings.LQ
        ? channel.visibleName
        : `${channel.visibleName} (LQ)`,
      type: 'normal',
      click: (
        menuItem: MenuItem,
        browserWindow: BrowserWindow,
        event: any,
      ): void => {
        channel.emit('play', event.ctrlKey, event.shiftKey ? true : null);
      },
      icon: channel._trayIcon,
    };
  });

  return Menu.buildFromTemplate(contextMenuTemplate as any);
}
