declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, ...args: unknown[]) => void;
      sendSync: <T>(channel: string, ...args: unknown[]) => T;
      invoke: <T>(channel: string, ...args: unknown[]) => Promise<T>;
      on: (
        channel: string,
        listener: (
          event: Electron.IpcRendererEvent,
          ...args: unknown[]
        ) => void,
      ) => () => void;
      openChannelMenu: (channelId: string, callback: () => void) => void;
    };
  }
}

export {};
