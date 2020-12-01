import { shell, Notification, nativeImage, NativeImage } from 'electron';

import { config } from './settings-file';
import { addLogs } from './logs';
import { iconPathBalloon } from './main';
import { Channel } from './channel-class';

export function printNotification(
  title: string,
  content: string,
  channelObj: Channel = null,
): void {
  if (!config.settings.showNotifications) {
    return;
  }

  printNewNotification(title, content, channelObj);
}

function printNewNotification(title, content, channelObj: Channel): void {
  let icon: string | NativeImage = iconPathBalloon;

  if (channelObj) {
    const iconBuffer = channelObj._icon
      ? channelObj._icon
      : channelObj.serviceObj.icon;

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
    onBalloonClick(title, content, channelObj);
  });

  notification.show();
}

function onBalloonClick(title, content, channelObj): void {
  addLogs('balloon was clicked.');

  if (!config.settings.launchOnBalloonClick) {
    return;
  }

  if (title.indexOf('Stream is Live') === 0) {
    channelObj.emit('play');
  }

  if (title.includes('Update Available')) {
    shell.openExternal(content);
  }
}
