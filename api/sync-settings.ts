import { klpqServiceClient } from './api-clients';
import { Channel } from './channel-class';
import { config } from './settings-file';

class SyncSettings {
  public async init() {
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

      return newSyncId;
    }

    const syncedChannels = await klpqServiceClient.getSyncChannels(syncId);

    for (const localChannel of config.channels) {
      const findSyncedChannel = syncedChannels.find(
        (syncedChannel) => syncedChannel.link === localChannel.link,
      );

      if (!findSyncedChannel) {
        config.removeChannelById(localChannel.id);
      }
    }

    const newChannels: Channel[] = [];

    for (const syncedChannel of syncedChannels) {
      const findLocalChannel = config.channels.find(
        (localChannel) => localChannel.link === syncedChannel.link,
      );

      if (!findLocalChannel) {
        const channel = config.addChannelLink(syncedChannel.link, false);

        if (channel) {
          channel.update(syncedChannel);

          newChannels.push(channel);
        }

        continue;
      }
    }

    await config.addChannels(newChannels);

    return syncedChannels;
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

    return newSyncId;
  }
}

export const syncSettings = new SyncSettings();
