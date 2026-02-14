import { BrowserWindow, Menu, MenuItem } from 'electron';

import { config } from './settings-file';
import { contextMenuTemplate } from './main';
import { Channel } from './channel-class';
import { logger } from './logs';

export function rebuildIconMenu(): Menu {
  logger('info', 'rebuildIconMenu');

  const onlineChannels = config.find({
    isLive: true,
  }).channels;

  contextMenuTemplate[1]!['submenu'] = onlineChannels.map(
    (channel: Channel) => {
      const icon = channel.trayIcon();

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
    },
  );

  return Menu.buildFromTemplate(contextMenuTemplate);
}
