import { BrowserWindow, Menu, MenuItem } from 'electron';

import { config } from './settings-file';
import { contextMenuTemplate } from './main';
import { Channel } from './channel-class';
import { logger } from './logs';

export function rebuildIconMenu(): Menu {
  logger('info', 'rebuildIconMenu');

  const { channels } = config.find({
    isLive: true,
  });

  contextMenuTemplate[1]!['submenu'] = channels.map((channel) => {
    const icon = channel.trayIcon() || undefined;

    return {
      label: !config.settings.LQ
        ? channel.visibleName
        : `${channel.visibleName} (LQ)`,
      type: 'normal',
      visible: true,
      click: async (
        menuItem: MenuItem,
        browserWindow: BrowserWindow,
        event,
      ) => {
        await channel.startPlaying(!!event.ctrlKey, !!event.shiftKey);
      },
      icon,
    };
  });

  return Menu.buildFromTemplate(contextMenuTemplate);
}
