import { shell, Notification, nativeImage, NativeImage } from 'electron';

import { config } from './settings-file';
import { addLogs } from './logs';
import { iconPathBalloon } from './main';
import { Channel } from './channel-class';

export function printNotification(
  title: string,
  content: string,
  channel: Channel = null,
): void {
  if (!config.settings.showNotifications) {
    return;
  }

  printNewNotification(title, content, channel);
}

function printNewNotification(
  title: string,
  content: string,
  channel: Channel,
): void {
  let icon: string | NativeImage = iconPathBalloon;

  if (channel) {
    const iconBuffer = channel._icon ? channel._icon : channel.icon();

    if (iconBuffer) {
      icon = nativeImage.createFromBuffer(iconBuffer);
    }
  }

  const notification = new Notification({
    icon: icon,
    title: title,
    body: content,
  });

  notification.on('click', () => {
    onBalloonClick(title, content, channel);
  });

  notification.show();
}

function onBalloonClick(
  title: string,
  content: string,
  channel: Channel,
): void {
  addLogs('balloon was clicked.');

  if (!config.settings.launchOnBalloonClick) {
    return;
  }

  if (title.indexOf('Stream is Live') === 0) {
    channel.emit('play');
  }

  if (title.includes('Update Available')) {
    shell.openExternal(content);
  }
}
