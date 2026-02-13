import { MenuItemConstructorOptions } from 'electron';
import { Channel } from '../Shared/types';

export type TabValue = 'online' | 'offline';

export interface Tab {
  name: string;
  value: TabValue;
  filter: keyof Channel;
  filterValue: boolean;
}

export const getTab = (tab: TabValue): Tab | undefined => {
  return TABS.find((t) => t.value === tab);
};

export const visibleByTab = (channel: Channel, tab: Tab) =>
  channel[tab.filter] === tab.filterValue;

export const TABS: Tab[] = [
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
  window.electronAPI.invoke('show_edit_menu', template);
};
