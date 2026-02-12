import { menuTemplate } from '../../Channel/Helpers/menu';
import { Menu } from '@electron/remote';
import * as remote from '@electron/remote';
import {
  Channel,
  ChannelCount,
  ChannelQuery,
  Integrations,
  Settings,
} from '../../Shared/types';

const { ipcRenderer } = window.require('electron');

export const addChannel = (channel: string) => {
  ipcRenderer.send('channel_add', channel);
};

export const deleteChannel = (channel: Channel) => {
  ipcRenderer.send('channel_remove', channel.id);
};

export const changeChannelSetting = (
  id: string,
  settingName: keyof Channel | keyof Settings,
  settingValue: unknown,
) => {
  ipcRenderer.send('channel_changeSettingSync', id, settingName, settingValue);
};

export const playChannel = (channel: Channel) => {
  ipcRenderer.send('channel_play', channel.id);
};

export const getVersion = (): string => {
  return ipcRenderer.sendSync('client_getVersion');
};

export const getSettings = (): {
  settings: Settings;
  integrations: Integrations;
} => {
  return {
    settings: ipcRenderer.sendSync('getSettings'),
    integrations: ipcRenderer.sendSync('getIntegrations'),
  };
};

export const importChannel = (name: string) => {
  return ipcRenderer.send('config_twitchImport', name);
};

export const changeSetting = (
  name: keyof Settings | string,
  value: unknown,
) => {
  return ipcRenderer.send('config_changeSetting', name, value);
};

export const getChannels = (
  query: ChannelQuery,
  caller: string,
): Promise<{
  channels: Channel[];
  count: ChannelCount;
}> => {
  return ipcRenderer.invoke('config_find', {
    ...query,
    caller,
  });
};

export const openChannelMenu = (
  channel: Channel,
  func: (channel: Channel) => void,
) => {
  const menu = new Menu();

  const template = menuTemplate(channel, func);

  template.map((item) => menu.append(item));

  menu.popup({ window: remote.getCurrentWindow() });
};
