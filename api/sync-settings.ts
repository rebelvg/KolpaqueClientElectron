import { klpqServiceClient } from './api-clients';
import { Channel } from './channel-class';
import { addLogs } from './logs';
import { config } from './settings-file';

class SyncSettings {
  public async init() {
    addLogs('sync_init');

    const { syncId } = config.settings;

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

      return;
    }

    const syncedChannels = await klpqServiceClient.getSyncChannels(syncId);

    if (!syncedChannels) {
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
      settings: { syncId },
    } = config;

    const channels = config.generateSaveChannels();

    const newSyncId = await klpqServiceClient.saveSyncChannels(
      syncId,
      channels,
    );

    if (!newSyncId) {
      return;
    }

    config.settings.syncId = newSyncId;

    return;
  }
}

export const syncSettings = new SyncSettings();
