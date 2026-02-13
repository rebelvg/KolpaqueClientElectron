declare global {
  interface Window {
    electronAPI: {
      send: (eventName: string, ...args: unknown[]) => void;
      sendSync: <T>(eventName: string, ...args: unknown[]) => T;
      invoke: <T>(eventName: string, ...args: unknown[]) => Promise<T>;
      on: (
        eventName: string,
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
