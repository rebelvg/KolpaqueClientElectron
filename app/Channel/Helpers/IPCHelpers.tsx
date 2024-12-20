import { menuTemplate } from '../../Channel/Helpers/menu';
import { Menu } from '@electron/remote';
import * as remote from '@electron/remote';

const { ipcRenderer } = window.require('electron');

export const addChannel = (channel) => {
  ipcRenderer.send('channel_add', channel);
};

export const deleteChannel = (channel) => {
  ipcRenderer.send('channel_remove', channel.id);
};

export const changeChannelSetting = (id, settingName, settingValue) => {
  ipcRenderer.send('channel_changeSettingSync', id, settingName, settingValue);
};

export const playChannel = (channel) => {
  ipcRenderer.send('channel_play', channel.id);
};

export const getVersion = () => {
  return ipcRenderer.sendSync('client_getVersion');
};

export const getSettings = () => {
  return {
    settings: ipcRenderer.sendSync('getSettings'),
    integrations: ipcRenderer.sendSync('getIntegrations'),
  };
};

export const importChannel = (name: string) => {
  return ipcRenderer.send('config_twitchImport', name);
};

export const changeSetting = (name: string, value: any) => {
  return ipcRenderer.send('config_changeSetting', name, value);
};

export const getChannels = (
  query: {
    isLive: boolean;
    filter: string;
  },
  caller: string,
): Promise<{
  channels: any[];
  count: { online: number; offline: number };
}> => {
  return ipcRenderer.invoke('config_find', {
    ...query,
    caller,
  });
};

export const openChannelMenu = (channel, func) => {
  const menu = new Menu();

  const template = menuTemplate(channel, func);

  template.map((item) => menu.append(item));

  menu.popup({ window: remote.getCurrentWindow() });
};
