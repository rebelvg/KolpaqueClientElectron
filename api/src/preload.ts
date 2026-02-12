import { contextBridge, ipcRenderer, shell } from 'electron';

type IpcListener = (
  event: Electron.IpcRendererEvent,
  ...args: unknown[]
) => void;

type ChannelLike = {
  id: string;
  link: string;
  visibleName?: string;
};

const channelRenameListeners = new Set<(channel: ChannelLike) => void>();

function emitChannelRename(channel: ChannelLike) {
  channelRenameListeners.forEach((listener) => listener(channel));
}

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
  openChannelMenu: (channel: ChannelLike, onClose?: () => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      renamed: ChannelLike,
    ) => {
      if (renamed.id === channel.id) {
        emitChannelRename(renamed);
      }
    };

    ipcRenderer.on('channel_rename', handler);

    ipcRenderer.invoke('open_channel_menu', channel).finally(() => {
      ipcRenderer.removeListener('channel_rename', handler);

      if (onClose) {
        onClose();
      }
    });
  },
  onChannelRename: (listener: (channel: ChannelLike) => void) => {
    channelRenameListeners.add(listener);

    return () => channelRenameListeners.delete(listener);
  },
});

ipcRenderer.on('channel_rename', (_event, channel: ChannelLike) => {
  emitChannelRename(channel);
});
