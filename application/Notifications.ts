import { app, shell, Notification, nativeImage } from 'electron';
import * as _ from 'lodash';

import { config } from './SettingsFile';
import { registeredServices } from './Globals';
import { addLogs } from './Logs';

export function printNotification(title, content, channelObj = null) {
  if (!config.settings.showNotifications) return;

  printNewNotification(title, content, channelObj);
}

function printNewNotification(title, content, channelObj) {
  let icon = app['appIcon'].iconPathBalloon;

  if (channelObj) {
    let iconBuffer = channelObj._icon ? channelObj._icon : registeredServices[channelObj.service].icon;

    if (iconBuffer) {
      icon = nativeImage.createFromBuffer(iconBuffer);
    }
  }

  let notification = new Notification({
    icon: icon,
    title: title,
    body: content
  });

  notification.on('click', function(event) {
    onBalloonClick(title, content, channelObj);
  });

  notification.show();
}

function onBalloonClick(title, content, channelObj) {
  addLogs('balloon was clicked.');

  if (!config.settings.launchOnBalloonClick) return;

  if (title.indexOf('Stream is Live') === 0) {
    channelObj.emit('play');
  }

  if (title.includes('Update Available')) {
    shell.openExternal(content);
  }
}
