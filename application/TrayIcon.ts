import { app, Menu, nativeImage } from 'electron';
import * as _ from 'lodash';

import { config } from './SettingsFile';
import { registeredServices } from './Globals';
import { Channel } from './ChannelClass';

function setChannelEvents(channelObj) {}

config.on('setting_changed', (settingName, settingValue) => {
  if (settingName === 'showNotifications') {
    app['contextMenuTemplate'][3].checked = settingValue;
  }
});

_.forEach(config.channels, setChannelEvents);

config.on('channel_added', setChannelEvents);
config.on('channel_added_channels', async (channels: Channel[]) => {
  channels.forEach(channel => {
    setChannelEvents(channel);
  });
});

export function rebuildIconMenu() {
  const onlineChannels = config.find({
    isLive: true
  }).channels;

  const contextMenuTemplate = app['contextMenuTemplate'];

  contextMenuTemplate[1].submenu = onlineChannels.map(channelObj => {
    if (!channelObj._trayIcon) {
      const iconBuffer = channelObj._icon ? channelObj._icon : registeredServices[channelObj.service].icon;

      if (iconBuffer) {
        channelObj._trayIcon = nativeImage.createFromBuffer(iconBuffer).resize({ height: 16 });
      }
    }

    return {
      label: !config.settings.LQ ? channelObj.visibleName : `${channelObj.visibleName} (LQ)`,
      type: 'normal',
      click: (menuItem, browserWindow, event) => {
        channelObj.emit('play', event.ctrlKey, event.shiftKey ? true : null);
      },
      icon: channelObj._trayIcon
    };
  });

  return Menu.buildFromTemplate(contextMenuTemplate);
}
