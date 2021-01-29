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
  addLogs('printNotification', title, content);

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
    const iconBuffer = channel.icon();

    if (iconBuffer) {
      icon = nativeImage.createFromBuffer(iconBuffer);
    }
  }

  const notification = new Notification({
    icon: icon,
    title: title,
    body: content,
    silent: !config.settings.enableNotificationSounds,
  });

  notification.on('click', () => {
    onBalloonClick(title, content, channel);
  });

  notification.show();
}

async function onBalloonClick(
  title: string,
  content: string,
  channel: Channel,
) {
  addLogs('balloon_click', title, content);

  if (!config.settings.launchOnBalloonClick) {
    return;
  }

  if (title.indexOf('Stream is Live') === 0) {
    await channel.startPlaying();
  }

  if (title.includes('Update Available')) {
    shell.openExternal(content);
  }
}
