import { shell, Notification, nativeImage, NativeImage } from 'electron';

import { config } from './settings-file';
import { addLogs } from './logs';
import { iconPathBalloon } from './main';
import { Channel } from './channel-class';
import { sleep } from './helpers';

export function printNotification(
  title: string,
  content: string,
  channel: Channel | null = null,
): void {
  addLogs('info', 'printNotification', title, content);

  if (!config.settings.showNotifications) {
    return;
  }

  printNewNotification(title, content, channel);
}

function printNewNotification(
  title: string,
  content: string,
  channel: Channel | null,
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

  sleep(30 * 1000).then(() => {
    if (channel && !channel.isPinned) {
      notification.close();
    }
  });
}

async function onBalloonClick(
  title: string,
  content: string,
  channel: Channel | null,
) {
  addLogs('info', 'balloon_click', title, content);

  if (!config.settings.launchOnBalloonClick) {
    return;
  }

  if (title.includes('Stream is Live')) {
    await channel?.startPlaying();
  }

  if (title.includes('Update Available')) {
    shell.openExternal(content);
  }
}
