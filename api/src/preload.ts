import { contextBridge, ipcRenderer, shell } from 'electron';

type IpcListener = (
  event: Electron.IpcRendererEvent,
  ...args: unknown[]
) => void;

const CHANNEL_RENAME_MAP = {};

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, ...args: unknown[]) =>
    ipcRenderer.send(channel, ...args),
  sendSync: (channel: string, ...args: unknown[]) =>
    ipcRenderer.sendSync(channel, ...args),
  invoke: <T = unknown>(channel: string, ...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args) as Promise<T>,
  on: (channel: string, listener: IpcListener) => {
    ipcRenderer.on(channel, listener);

    return () => ipcRenderer.removeListener(channel, listener);
  },
  once: (channel: string, listener: IpcListener) => {
    ipcRenderer.once(channel, listener);

    return () => ipcRenderer.removeListener(channel, listener);
  },
  removeAllListeners: (channel: string) =>
    ipcRenderer.removeAllListeners(channel),
  openExternal: (url: string) => shell.openExternal(url),
  showEditMenu: (template: Electron.MenuItemConstructorOptions[]) =>
    ipcRenderer.invoke('show_edit_menu', template),
  openChannelMenu: (channelId: string, callback: () => void) => {
    CHANNEL_RENAME_MAP[channelId] = callback;

    ipcRenderer.invoke('open_channel_menu', channelId);
  },
});

ipcRenderer.on('channel_rename', (_event, channelId: string) => {
  CHANNEL_RENAME_MAP[channelId]?.();
});
