import { BrowserWindow, Menu, MenuItem, nativeImage } from 'electron';

import { config } from './settings-file';
import { contextMenuTemplate } from './main';
import { Channel } from './channel-class';

export function rebuildIconMenu(): Menu {
  const onlineChannels = config.find({
    isLive: true,
  }).channels;

  contextMenuTemplate[1]['submenu'] = onlineChannels.map((channel: Channel) => {
    if (!channel._trayIcon) {
      const iconBuffer = channel.icon();

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
      click: async (
        menuItem: MenuItem,
        browserWindow: BrowserWindow,
        event: any,
      ) => {
        await channel.startPlaying(event.ctrlKey, event.shiftKey ? true : null);
      },
      icon: channel._trayIcon,
    };
  });

  return Menu.buildFromTemplate(contextMenuTemplate as any);
}
