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
    'channel_changeSetting_app',
    id,
    settingName,
    settingValue,
  );
};

export const playChannel = (channel: Channel) => {
  window.electronAPI.send('channel_play', channel.id);
};

export const getName = () => {
  return window.electronAPI.sendSync<string>('client_getName');
};

export const getVersion = () => {
  return window.electronAPI.sendSync<string>('client_getVersion');
};

export const getSettings = (): {
  settings: Settings;
  integrations: Integrations;
} => {
  return {
    settings: window.electronAPI.sendSync<Settings>('getSettings'),
    integrations: window.electronAPI.sendSync<Integrations>('getIntegrations'),
  };
};

export const importChannel = (name: string) => {
  return window.electronAPI.send('config_twitchImport', name);
};

export const changeSetting = (
  name: keyof Settings | string,
  value: unknown,
) => {
  return window.electronAPI.send('config_changeSetting_app', name, value);
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

export const openChannelMenu = (channelId: string, callback: () => void) => {
  window.electronAPI.openChannelMenu(channelId, callback);
};
