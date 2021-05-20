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

  let filteredChannels = [];

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
  let sortedChannels = [];

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
  syncId: string;
}

export interface ISavedSettingsFile {
  channels: {
    link: string;
    visibleName: string;
    isPinned: boolean;
    autoStart: boolean;
    autoRestart: boolean;
    channelAdded: Date;
  }[];
  settings: ISettings;
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
    syncId: null,
  };

  constructor() {
    super();

    this.run();
  }

  private run() {
    this.readFile();

    this.saveLoop();
  }

  private readFile(): Promise<void> {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      return;
    }

    const file = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');

    let parseJson: ISavedSettingsFile;

    try {
      parseJson = JSON.parse(file);
    } catch (error) {
      addLogs(error);

      return;
    }

    try {
      for (const parsedChannel of parseJson.channels) {
        const channel = this.addChannelLink(parsedChannel.link);

        if (channel) {
          channel.update(parsedChannel);
        }
      }

      this.settings = {
        ...this.settings,
        ...parseJson.settings,
      };
    } catch (error) {
      addLogs(error);

      throw error;
    }
  }

  private async saveLoop(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(5 * 60 * 1000);

      this.saveFile();
    }
  }

  addChannelLink(channelLink: string): Channel {
    const channel = Config.buildChannel(channelLink);

    if (!channel) {
      return null;
    }

    const res = this.findChannelByLink(channel.link);

    if (res !== null) {
      return null;
    }

    channel.lastUpdated = Date.now();

    this.channels.push(channel);

    return channel;
  }

  static buildChannel(channelLink: string): Channel {
    try {
      return new Channel(channelLink);
    } catch (e) {
      addLogs(e);

      return null;
    }
  }

  removeChannelById(id: string): boolean {
    const channel = this.findById(id);

    if (!this.channels.includes(channel)) {
      return true;
    }

    _.pull(this.channels, channel);

    main.mainWindow.webContents.send('channel_removeSync');

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

  findById(id: string): Channel {
    const channel = this.channels.find((channel) => {
      return channel.id === id;
    });

    if (!channel) {
      return null;
    }

    return channel;
  }

  findChannelByLink(channelLink: string): Channel {
    const channel = this.channels.find((channel) => {
      return channel.link === channelLink;
    });

    if (!channel) {
      return null;
    }

    return channel;
  }

  find(query: any = {}) {
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
        offline: _.filter(filteredChannels, { isLive: false }).length,
        online: _.filter(filteredChannels, { isLive: true }).length,
      },
    };
  }

  saveFile(): boolean {
    try {
      const channels = this.generateSaveChannels();

      const saveConfig: ISavedSettingsFile = {
        channels,
        settings: this.settings,
      };

      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(saveConfig, null, 2));

      syncSettings.save();

      addLogs('settings_saved');

      return true;
    } catch (e) {
      addLogs(e);

      return false;
    }
  }

  public async runChannelUpdates(channels: Channel[]) {
    await Promise.all(channels.map((channel) => channel.getStats(false)));

    await Promise.all(channels.map((channel) => channel.getInfo()));

    main.mainWindow.webContents.send('channel_addSync');
  }

  public setSettings(settingName: string, settingValue: unknown) {
    if (settingName === 'showNotifications') {
      contextMenuTemplate[3].checked = settingValue;
    }

    main.mainWindow.webContents.send(
      'config_changeSetting',
      settingName,
      settingValue,
    );
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
      }) => ({
        link,
        visibleName,
        isPinned,
        autoStart,
        autoRestart,
        channelAdded,
      }),
    );
  }
}
