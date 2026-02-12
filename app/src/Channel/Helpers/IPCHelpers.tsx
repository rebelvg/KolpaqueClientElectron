import {
  Channel,
  ChannelCount,
  ChannelQuery,
  Integrations,
  Settings,
} from '../../Shared/types';

export const addChannel = (channel: string) => {
  window.electronAPI.send('channel_add', channel);
};

export const deleteChannel = (channel: Channel) => {
  window.electronAPI.send('channel_remove', channel.id);
};

export const changeChannelSetting = (
  id: string,
  settingName: keyof Channel | keyof Settings,
  settingValue: unknown,
) => {
  window.electronAPI.send(
    'channel_changeSettingSync',
    id,
    settingName,
    settingValue,
  );
};

export const playChannel = (channel: Channel) => {
  window.electronAPI.send('channel_play', channel.id);
};

export const getVersion = (): string => {
  return window.electronAPI.sendSync('client_getVersion') as string;
};

export const getSettings = (): {
  settings: Settings;
  integrations: Integrations;
} => {
  return {
    settings: window.electronAPI.sendSync('getSettings') as Settings,
    integrations: window.electronAPI.sendSync(
      'getIntegrations',
    ) as Integrations,
  };
};

export const importChannel = (name: string) => {
  return window.electronAPI.send('config_twitchImport', name);
};

export const changeSetting = (
  name: keyof Settings | string,
  value: unknown,
) => {
  return window.electronAPI.send('config_changeSetting', name, value);
};

export const getChannels = (
  query: ChannelQuery,
  caller: string,
): Promise<{
  channels: Channel[];
  count: ChannelCount;
}> => {
  return window.electronAPI.invoke<{
    channels: Channel[];
    count: ChannelCount;
  }>('config_find', {
    ...query,
    caller,
  });
};

export const openChannelMenu = (
  channel: Channel,
  func: (channel: Channel) => void,
) => {
  let unsubscribe: (() => void) | null = null;

  unsubscribe = window.electronAPI.onChannelRename((renamedChannel) => {
    if (renamedChannel.id !== channel.id) {
      return;
    }

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    func(renamedChannel);
  });

  window.electronAPI.openChannelMenu(channel, () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });
};
