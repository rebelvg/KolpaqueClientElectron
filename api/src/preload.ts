import { contextBridge, ipcRenderer } from 'electron';

const CHANNEL_RENAME_MAP = {};

contextBridge.exposeInMainWorld('electronAPI', {
  send: (eventName: string, ...args: unknown[]) =>
    ipcRenderer.send(eventName, ...args),
  sendSync: <T>(eventName: string, ...args: unknown[]): T =>
    ipcRenderer.sendSync(eventName, ...args),
  invoke: <T>(eventName: string, ...args: unknown[]): Promise<T> =>
    ipcRenderer.invoke(eventName, ...args),
  on: (
    eventName: string,
    listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void,
  ) => {
    ipcRenderer.on(eventName, listener);

    return () => ipcRenderer.removeListener(eventName, listener);
  },
  openChannelMenu: (channelId: string, callback: () => void) => {
    CHANNEL_RENAME_MAP[channelId] = callback;

    ipcRenderer.invoke('open_channel_menu', channelId);
  },
});

ipcRenderer.on('channel_rename', (_event, channelId: string) => {
  CHANNEL_RENAME_MAP[channelId]?.();
});
