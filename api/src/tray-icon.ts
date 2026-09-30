import {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  nativeImage,
  NativeImage,
} from 'electron';

import * as path from 'path';

import { config } from './settings-file';
import { contextMenuTemplate, main, toggleHideClient } from './main';
import { logger } from './logs';
import { Channel } from './channel-class';

// A tiny bitmap font keeps the badge legible without depending on system fonts.
const badgeGlyphs: Record<string, string[]> = {
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '110'],
  '+': ['000', '010', '111', '010', '000'],
};

export function createLiveTrayIcon(
  icon: NativeImage,
  count: number,
): NativeImage {
  if (count <= 0) {
    return icon;
  }

  const label = count > 9 ? '9+' : String(count);

  if (process.platform === 'darwin') {
    return nativeImage.createFromPath(
      path.join(app.getAppPath(), 'api', 'icons', `live-${label}Template.png`),
    );
  }

  const liveIcon = nativeImage.createEmpty();

  for (const scaleFactor of icon.getScaleFactors()) {
    const { width, height } = icon.getSize(scaleFactor);
    const bitmap = icon.toBitmap({ scaleFactor });
    const unit = Math.min(width, height) / 16;
    const badgeWidth = (label.length * 4 + 1) * unit;
    const badgeHeight = 7 * unit;
    const left = width - badgeWidth;
    const border = unit;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x + 0.5 < left - border || y + 0.5 >= badgeHeight + border) {
          continue;
        }

        const offset = (y * width + x) * 4;
        const inside = x + 0.5 >= left && y + 0.5 < badgeHeight;
        const textX = Math.floor((x + 0.5 - left) / unit) - 1;
        const textY = Math.floor((y + 0.5) / unit) - 1;
        const glyph = badgeGlyphs[label[Math.floor(textX / 4)] ?? ''];
        const isText =
          inside && textX >= 0 && glyph?.[textY]?.[textX % 4] === '1';

        // Premultiplied BGRA: white text on a red badge.
        const alpha = inside ? 255 : 0;

        bitmap[offset] = alpha && isText ? 255 : 0;
        bitmap[offset + 1] = alpha ? (isText ? 255 : 59) : 0;
        bitmap[offset + 2] = alpha ? (isText ? 255 : 239) : 0;
        bitmap[offset + 3] = alpha;
      }
    }

    const representation = nativeImage.createFromBitmap(bitmap, {
      width,
      height,
    });

    liveIcon.addRepresentation({
      scaleFactor,
      dataURL: representation.toDataURL(),
    });
  }

  return liveIcon;
}

export function rebuildIconMenu(): Menu {
  logger('info', 'rebuildIconMenu');

  const { channels } = config.find({
    isLive: true,
  });

  const channelMenuItem = (
    channel: Channel,
  ): Electron.MenuItemConstructorOptions => {
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
  };

  const favorites = channels
    .filter((channel) => channel.isPinned)
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 3);

  const template: Electron.MenuItemConstructorOptions[] = [
    ...contextMenuTemplate,
  ];

  if (process.platform === 'darwin') {
    const window = main.mainWindow;

    template.unshift({
      label: window?.isVisible() ? 'Hide Client' : 'Open Client',
      enabled: !!window && !window.isDestroyed(),
      click: toggleHideClient,
    });
  }

  if (channels.length > 0) {
    template.push({ type: 'separator' });
    template.push({
      label: `Online Channels (${channels.length})`,
      type: 'submenu',
      submenu: channels.map(channelMenuItem),
    });
  }
  template.push(...favorites.map(channelMenuItem));

  return Menu.buildFromTemplate(template);
}
