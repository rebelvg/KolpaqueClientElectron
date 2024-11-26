import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { EventEmitter } from 'events';

import { Channel } from './channel-class';
import { addLogs } from './logs';
import { contextMenuTemplate, main } from './main';
import { sleep } from './helpers';
import { syncSettings } from './sync-settings';
import { checkChannels } from './channel-check';
import { getChannelInfo } from './channel-info';
import { SourcesEnum } from './enums';
import { config } from './settings-file';

const SETTINGS_FILE_PATH = path.join(
  app.getPath('documents'),
  'KolpaqueClientElectron.json',
);

const filterChannel = (channel: Channel, filter: string): boolean => {
  filter = filter.trim();

  if (!filter) {
    return true;
  }

  const filters = filter.split(/\s+/gi);

  const searchFilters = _.map(filters, (filter) => {
    return {
      pattern: filter,
      found: false,
    };
  });

  _.forEach(
    [channel.link, channel.name, channel.visibleName],
    (searchString) => {
      _.forEach(searchFilters, (filter) => {
        const regExp = new RegExp(filter.pattern, 'gi');

        if (regExp.test(searchString)) {
          filter.found = true;
        }
      });
    },
  );

  return _.filter(searchFilters, 'found').length === filters.length;
};

const filterChannels = (channels: Channel[], filter: string): Channel[] => {
  filter = filter.trim();

  if (!filter) {
    return channels;
  }

  let filteredChannels: Channel[] = [];

  filteredChannels = _.filter(channels, (channel) => {
    return filterChannel(channel, filter);
  });

  return filteredChannels;
};

const sortChannels = (
  channels: Channel[],
  sortType: string,
  isReversed = false,
): Channel[] => {
  let sortedChannels: Channel[] = [];

  switch (sortType) {
    case 'lastAdded': {
      sortedChannels = _.sortBy(channels, ['channelAdded']);
      break;
    }
    case 'lastUpdated': {
      sortedChannels = _.sortBy(channels, ['lastUpdated']);
      break;
    }
    case 'service_visibleName': {
      sortedChannels = _.sortBy(channels, ['serviceName', 'visibleName']);
      break;
    }
    case 'visibleName': {
      sortedChannels = _.sortBy(channels, ['visibleName']);
      break;
    }
    default: {
      sortedChannels = _.sortBy(channels, ['channelAdded']);
    }
  }

  if (isReversed) {
    sortedChannels.reverse();
  }

  sortedChannels = _.sortBy(sortedChannels, [
    (channel: Channel): boolean => !channel.isPinned,
  ]);

  return sortedChannels;
};

interface ISettings {
  LQ: boolean;
  showNotifications: boolean;
  enableNotificationSounds: boolean;
  minimizeAtStart: boolean;
  launchOnBalloonClick: boolean;
  size: number[];
  enableKolpaqueImport: boolean;
  enableTwitchImport: boolean;
  twitchImport: string[];
  nightMode: boolean;
  sortType: string;
  sortReverse: boolean;
  confirmAutoStart: boolean;
  playInWindow: boolean;
  useStreamlinkForCustomChannels: boolean;
  twitchRefreshToken: string;
  youtubeTosConsent: boolean;
  youtubeRefreshToken: string;
  enableSync: boolean;
  klpqJwtToken: string | null;
  customRtmpClientCommand: string;
}

export interface ISavedSettingsFile {
  channels: {
    link: string;
    visibleName: string;
    isPinned: boolean;
    autoStart: boolean;
    autoRestart: boolean;
    channelAdded: Date;
    sources: SourcesEnum[];
  }[];
  settings: ISettings;
  migrations: string[];
  deletedChannels: string[];
}

export class Config extends EventEmitter {
  public channels: Channel[] = [];
  public settings: ISettings = {
    LQ: false,
    showNotifications: true,
    enableNotificationSounds: false,
    minimizeAtStart: false,
    launchOnBalloonClick: true,
    size: [400, 800],
    enableKolpaqueImport: false,
    enableTwitchImport: false,
    twitchImport: [],
    nightMode: false,
    sortType: 'lastAdded',
    sortReverse: false,
    confirmAutoStart: true,
    playInWindow: false,
    useStreamlinkForCustomChannels: false,
    twitchRefreshToken: '',
    youtubeTosConsent: false,
    youtubeRefreshToken: '',
    enableSync: false,
    klpqJwtToken: null,
    customRtmpClientCommand: '',
  };
  public migrations: string[] = [];
  public deletedChannels: string[] = [];

  constructor() {
    super();

    this.run();
  }

  private run() {
    this.readFile();

    this.saveLoop();
  }

  private readFile(): void {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      return;
    }

    const file = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');

    let parseJson: ISavedSettingsFile;

    try {
      parseJson = JSON.parse(file);

      parseJson = this.runMigrations(parseJson);
    } catch (error) {
      addLogs('error', error);

      return;
    }

    try {
      for (const parsedChannel of parseJson.channels) {
        const channel = this.addChannelLink(parsedChannel.link, null);

        if (channel) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { link, ...updateData } = parsedChannel;

          channel.update({
            ...updateData,
          });
        }
      }

      this.settings = {
        ...this.settings,
        ...parseJson.settings,
      };

      this.migrations = parseJson.migrations || [];
      this.deletedChannels = parseJson.deletedChannels || [];
    } catch (error) {
      addLogs('error', error);

      throw error;
    }
  }

  private async saveLoop(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(60 * 1000);

      this.saveFile();
    }
  }

  addChannelLink(
    channelLink: string,
    source: SourcesEnum | null,
  ): Channel | undefined {
    const channel = Config.buildChannel(channelLink);

    if (!channel) {
      return;
    }

    const res = this.findByQuery({
      serviceName: channel.serviceName,
      name: channel.name,
    });

    if (res) {
      return;
    }

    channel.lastUpdated = Date.now();

    if (source) {
      channel.sources = [source];
    }

    this.channels.push(channel);

    return channel;
  }

  static buildChannel(channelLink: string): Channel | undefined {
    try {
      return new Channel(channelLink);
    } catch (error) {
      addLogs('error', error);

      return;
    }
  }

  removeChannelById(id: string): boolean {
    const channel = this.findById(id);

    if (!channel) {
      return true;
    }

    if (!this.channels.includes(channel)) {
      return true;
    }

    _.pull(this.channels, channel);

    config.deletedChannels.push(channel.link);

    main.mainWindow!.webContents.send('channel_removeSync');

    return true;
  }

  changeSetting(settingName: string, settingValue: unknown): boolean {
    if (!this.settings.hasOwnProperty(settingName)) {
      return false;
    }

    this.settings[settingName] = settingValue;

    this.setSettings(settingName, settingValue);

    return true;
  }

  findById(id: string): Channel | undefined {
    const channel = this.channels.find((channel) => {
      return channel.id === id;
    });

    if (!channel) {
      return;
    }

    return channel;
  }

  findByQuery(params: Partial<Channel>): Channel | undefined {
    return _.find(this.channels, params);
  }

  find(query: { filter?: string; isLive?: boolean } = {}) {
    const sort = {
      type: this.settings.sortType,
      isReversed: this.settings.sortReverse,
    };

    let filteredChannels = this.channels;

    if (_.isString(query.filter)) {
      filteredChannels = filterChannels(filteredChannels, query.filter);
    }

    filteredChannels = sortChannels(
      filteredChannels,
      sort.type,
      sort.isReversed,
    );

    return {
      channels: _.filter(filteredChannels, { isLive: query.isLive }),
      count: {
        online: _.filter(filteredChannels, { isLive: true }).length,
        offline: _.filter(filteredChannels, { isLive: false }).length,
      },
    };
  }

  saveFile(): boolean {
    try {
      const channels = this.generateSaveChannels();

      const saveConfig: ISavedSettingsFile = {
        channels,
        settings: this.settings,
        migrations: this.migrations,
        deletedChannels: this.deletedChannels,
      };

      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(saveConfig, null, 2));

      syncSettings
        .save()
        .then(() => {
          fs.writeFileSync(
            SETTINGS_FILE_PATH,
            JSON.stringify(saveConfig, null, 2),
          );
        })
        .catch();

      addLogs('info', 'settings_saved');

      return true;
    } catch (error) {
      addLogs('error', error);

      return false;
    }
  }

  public async runChannelUpdates(channels: Channel[], preInit: boolean) {
    await checkChannels(channels, false);

    if (!preInit) {
      await getChannelInfo(channels);
    }

    main.mainWindow!.webContents.send('channel_addSync');
  }

  public setSettings(settingName: string, settingValue: any) {
    if (settingName === 'showNotifications') {
      contextMenuTemplate[3]!.checked = settingValue as boolean;
    }

    if (settingName === 'enableSync' || settingName === 'syncId') {
      syncSettings.init();
    }

    this.updateSettingsPage();
  }

  public updateSettingsPage() {
    main.mainWindow!.webContents.send('config_changeSetting');
  }

  public generateSaveChannels(): ISavedSettingsFile['channels'] {
    return _.map(
      this.channels,
      ({
        link,
        visibleName,
        isPinned,
        autoStart,
        autoRestart,
        channelAdded,
        sources,
      }) => ({
        link,
        visibleName,
        isPinned,
        autoStart,
        autoRestart,
        channelAdded,
        sources,
      }),
    );
  }

  public runMigrations(parsedJson: ISavedSettingsFile) {
    if (!parsedJson.migrations) {
      parsedJson.migrations = [];
    }

    if (!parsedJson.migrations.includes('migration_1')) {
      parsedJson.channels = parsedJson.channels.map((channel, id) => {
        const dateNow = Date.now();

        return {
          ...channel,
          channelAdded: new Date(dateNow + id),
        };
      });

      parsedJson.migrations.push('migration_1');
    }

    if (!parsedJson.migrations.includes('migration_2')) {
      parsedJson.channels = parsedJson.channels.map((channel, id) => {
        return {
          ...channel,
          sources: [],
        };
      });

      parsedJson.migrations.push('migration_2');
    }

    if (!parsedJson.migrations.includes('migration_3')) {
      parsedJson.settings.customRtmpClientCommand = '';

      parsedJson.migrations.push('migration_3');
    }

    return parsedJson;
  }
}
