import { IpcRenderer } from 'electron';
import { menuTemplate } from '../../Channel/Helpers/menu';

const {
  remote,
  ipcRenderer,
}: { remote: any; ipcRenderer: IpcRenderer } = window.require('electron');
const { Menu } = remote;

export const addChannel = (channel) => {
  ipcRenderer.send('channel_add', channel);
};

export const deleteChannel = (channel) => {
  ipcRenderer.send('channel_remove', channel.id);
};

export const changeSetting = (id, settingName, settingValue) => {
  ipcRenderer.send('channel_changeSettingSync', id, settingName, settingValue);
};

export const playChannel = (channel) => {
  ipcRenderer.send('channel_play', channel.id);
};

export const getVersion = () => {
  return ipcRenderer.sendSync('client_getVersion');
};

export const getSettings = () => {
  ipcRenderer.sendSync('getSettings');
};

export const openChannelMenu = (channel, func) => {
  const menu = new Menu();

  const template = menuTemplate(channel, func);

  template.map((item) => menu.append(item));

  menu.popup(remote.getCurrentWindow());
};
