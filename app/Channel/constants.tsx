import { Menu } from '@electron/remote';
import * as remote from '@electron/remote';
import { MenuItemConstructorOptions } from 'electron';

export const getTab = (tab) => {
  return TABS.find((t) => t.value === tab);
};

export const visibleByTab = (channel, tab) =>
  channel[tab.filter] === tab.filterValue;

export const TABS = [
  {
    name: 'Online',
    value: 'online',
    filter: 'isLive',
    filterValue: true,
  },
  {
    name: 'Offline',
    value: 'offline',
    filter: 'isLive',
    filterValue: false,
  },
];

export const template: MenuItemConstructorOptions[] = [
  {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut',
  },
  {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy',
  },
  {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste',
  },
  {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectAll',
  },
];

export const openMenu = () => {
  const macMenu = Menu.buildFromTemplate(template);

  macMenu.popup({ window: remote.getCurrentWindow() });
};
