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
  private _syncId: string | undefined;

  constructor() {
    try {
      this._syncId = fs.readFileSync(SYNC_ID_FILE_PATH, { encoding: 'utf-8' });
    } catch (error) {}
  }

  private set syncId(id: string) {
    if (this._syncId !== id) {
      fs.writeFileSync(SYNC_ID_FILE_PATH, id);
    }

    this._syncId = id;
  }

  private get syncId(): string | undefined {
    return this._syncId;
  }

  public async init() {
    addLogs('info', 'sync_init');

    const { enableSync } = config.settings;
    const { syncId } = this;

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

      this.syncId = newSyncId;

      main.mainWindow!.webContents.send(
        'config_changeSetting',
        'syncId',
        syncId,
      );

      return;
    }

    const encryptedChannels = await klpqServiceClient.getSyncChannels(syncId);

    if (encryptedChannels) {
      let syncedChannels: ISavedSettingsFile['channels'] | undefined;

      try {
        syncedChannels = decryptData(encryptedChannels);
      } catch (error) {
        addLogs('error', error);
      }

      if (!syncedChannels) {
        addLogs('error', 'bad_sync_id', syncId);

        return;
      }

      const newChannels: Channel[] = [];

      for (const syncedChannel of syncedChannels) {
        if (config.deletedChannels.includes(syncedChannel.link)) {
          continue;
        }

        const findLocalChannel = config.findByQuery({
          link: syncedChannel.link,
        });

        if (!findLocalChannel) {
          addLogs('info', 'sync_adding_channel', syncedChannel.link);

          const channel = config.addChannelLink(syncedChannel.link, null);

          if (channel) {
            channel.update(syncedChannel);

            newChannels.push(channel);
          }

          continue;
        }

        findLocalChannel.update(syncedChannel);
      }

      await config.runChannelUpdates(newChannels, true);
    }

    return;
  }

  public async save() {
    const {
      settings: { enableSync },
    } = config;
    const { syncId } = this;

    if (!enableSync) {
      config.deletedChannels = [];

      return;
    }

    const channels = config.generateSaveChannels();

    const newSyncId = await klpqServiceClient.saveSyncChannels(
      syncId,
      encryptData(channels),
    );

    if (!newSyncId) {
      config.deletedChannels = [];

      return;
    }

    this.syncId = newSyncId;

    main.mainWindow?.webContents.send(
      'config_changeSetting',
      'syncId',
      this.syncId,
    );

    config.deletedChannels = [];

    return;
  }
}

export const syncSettings = new SyncSettings();
