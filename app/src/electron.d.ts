type IpcListener = (
  event: Electron.IpcRendererEvent,
  ...args: unknown[]
) => void;

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, ...args: unknown[]) => void;
      sendSync: (channel: string, ...args: unknown[]) => unknown;
      invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
      on: (channel: string, listener: IpcListener) => () => void;
      once: (channel: string, listener: IpcListener) => () => void;
      removeAllListeners: (channel: string) => void;
      openExternal: (url: string) => Promise<void>;
      showEditMenu: (template: Electron.MenuItemConstructorOptions[]) => void;
      openChannelMenu: (channelId: string, callback: () => void) => void;
    };
  }
}

export {};
