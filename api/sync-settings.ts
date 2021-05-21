import { klpqServiceClient } from './api-clients';
import { Channel } from './channel-class';
import { addLogs } from './logs';
import { main } from './main';
import { config } from './settings-file';

class SyncSettings {
  public async init() {
    addLogs('sync_init');

    const { enableSync, syncId } = config.settings;

    if (!enableSync) {
      return;
    }

    const channels = config.generateSaveChannels();

    if (!syncId) {
      const newSyncId = await klpqServiceClient.saveSyncChannels(
        syncId,
        channels,
      );

      if (!newSyncId) {
        return;
      }

      config.settings.syncId = newSyncId;

      main.mainWindow.webContents.send(
        'config_changeSetting',
        'syncId',
        config.settings.syncId,
      );

      return;
    }

    const syncedChannels = await klpqServiceClient.getSyncChannels(syncId);

    if (!syncedChannels) {
      addLogs('bad_sync_id', syncId);

      return;
    }

    for (const localChannel of config.channels) {
      const findSyncedChannel = syncedChannels.find(
        (syncedChannel) => syncedChannel.link === localChannel.link,
      );

      if (!findSyncedChannel) {
        addLogs('sync_removing_channel', localChannel.link);

        config.removeChannelById(localChannel.id);
      }
    }

    const newChannels: Channel[] = [];

    for (const syncedChannel of syncedChannels) {
      const findLocalChannel = config.channels.find(
        (localChannel) => localChannel.link === syncedChannel.link,
      );

      if (!findLocalChannel) {
        addLogs('sync_adding_channel', syncedChannel.link);

        const channel = config.addChannelLink(syncedChannel.link);

        if (channel) {
          channel.update(syncedChannel);

          newChannels.push(channel);
        }

        continue;
      }

      findLocalChannel.update(syncedChannel);

      newChannels.push(findLocalChannel);
    }

    await config.runChannelUpdates(newChannels);

    return;
  }

  public async save() {
    const {
      settings: { enableSync, syncId },
    } = config;

    if (!enableSync) {
      return;
    }

    const channels = config.generateSaveChannels();

    const newSyncId = await klpqServiceClient.saveSyncChannels(
      syncId,
      channels,
    );

    if (!newSyncId) {
      return;
    }

    config.settings.syncId = newSyncId;

    main.mainWindow.webContents.send(
      'config_changeSetting',
      'syncId',
      config.settings.syncId,
    );

    return;
  }
}

export const syncSettings = new SyncSettings();
