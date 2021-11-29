import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import { klpqServiceClient } from './api-clients';
import { Channel } from './channel-class';
import { addLogs } from './logs';
import { main } from './main';
import { config } from './settings-file';
import { ISavedSettingsFile } from './config-class';

const SYNC_ID_FILE_PATH = path.join(
  app.getPath('documents'),
  'KolpaqueClientElectron_sync_id',
);
const SYNC_ENCRYPTION_KEY_FILE_PATH = path.join(
  app.getPath('documents'),
  'KolpaqueClientElectron_encryption_key',
);

let encryptionKey = Buffer.alloc(0);

if (!fs.existsSync(SYNC_ENCRYPTION_KEY_FILE_PATH)) {
  encryptionKey = crypto.randomBytes(48);

  fs.writeFileSync(SYNC_ENCRYPTION_KEY_FILE_PATH, encryptionKey);
} else {
  encryptionKey = fs.readFileSync(SYNC_ENCRYPTION_KEY_FILE_PATH);
}

function encryptData(data: any): Buffer {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    encryptionKey.slice(0, 32),
    encryptionKey.slice(32),
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data)),
    cipher.final(),
  ]);

  return encrypted;
}

function decryptData(encrypted: Buffer): any {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    encryptionKey.slice(0, 32),
    encryptionKey.slice(32),
  );

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString());
}

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
        encryptData(channels),
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

      fs.writeFileSync(SYNC_ID_FILE_PATH, newSyncId);

      return;
    }

    const encryptedChannels = await klpqServiceClient.getSyncChannels(syncId);

    let syncedChannels: ISavedSettingsFile['channels'];

    try {
      syncedChannels = decryptData(encryptedChannels);
    } catch (error) {
      addLogs(error);
    }

    if (!syncedChannels) {
      addLogs('bad_sync_id', syncId);

      return;
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
    }

    await config.runChannelUpdates(newChannels, true);

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
      encryptData(channels),
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

    fs.writeFileSync(SYNC_ID_FILE_PATH, newSyncId);

    return;
  }
}

export const syncSettings = new SyncSettings();
