import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { EventEmitter } from 'events';

import { Channel } from './channel-class';
import { addLogs } from './logs';

const oldSettingsPath = path.join(
  app.getPath('documents'),
  'KolpaqueClient.json',
);
const settingsPath = path.join(
  app.getPath('documents'),
  'KolpaqueClientElectron.json',
);

if (fs.existsSync(oldSettingsPath)) {
  fs.renameSync(oldSettingsPath, settingsPath);
}

const channelSave = [
  'link',
  'visibleName',
  'isPinned',
  'autoStart',
  'autoRestart',
];

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
      sortedChannels = channels;
      break;
    }
    case 'lastUpdated': {
      sortedChannels = _.sortBy(channels, ['lastUpdated']);
      break;
    }
    case 'service_visibleName': {
      sortedChannels = _.sortBy(channels, ['service', 'visibleName']);
      break;
    }
    case 'visibleName': {
      sortedChannels = _.sortBy(channels, ['visibleName']);
      break;
    }
    default: {
      sortedChannels = channels;
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
  minimizeAtStart: boolean;
  launchOnBalloonClick: boolean;
  size: number[];
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
}

export class Config extends EventEmitter {
  public channels: Channel[] = [];
  public settings: ISettings = {
    LQ: false,
    showNotifications: true,
    minimizeAtStart: false,
    launchOnBalloonClick: true,
    size: [400, 800],
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
  };

  constructor() {
    super();

    this.run();
  }

  private run() {
    this.readFile();

    this.saveLoop();

    this.on('channel_added', () => {
      app['mainWindow'].webContents.send('channel_addSync');
    });

    this.on('channel_added_channels', () => {
      app['mainWindow'].webContents.send('channel_addSync');
    });

    this.on('channel_removed', () => {
      app['mainWindow'].webContents.send('channel_removeSync');
    });

    this.on('setting_changed', (settingName, settingValue) => {
      app['mainWindow'].webContents.send(
        'config_changeSetting',
        settingName,
        settingValue,
      );
    });

    this.on('setting_changed', () => {
      app['mainWindow'].webContents.send(
        'config_changeSettingSync',
        this.settings,
      );
    });
  }

  private readFile(): void {
    try {
      const file = fs.readFileSync(settingsPath, 'utf8');

      const parseJson = JSON.parse(file);

      _.forEach(parseJson.channels, (parsedChannel) => {
        const channel = this.addChannelLink(parsedChannel.link, false);

        if (channel) {
          channel.update(parsedChannel);
        }
      });

      _.forEach(this.settings, (settingValue, settingName) => {
        if (parseJson.settings.hasOwnProperty(settingName)) {
          this.settings[settingName] = parseJson.settings[settingName];
        }
      });
    } catch (error) {
      addLogs(error);

      throw error;
    }
  }

  private saveLoop(): void {
    setInterval(() => {
      this.saveFile();
    }, 5 * 60 * 1000);
  }

  addChannelLink(channelLink: string, emitEvent = true): Channel {
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

    if (emitEvent) {
      this.emit('channel_added', channel);
    }

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

    this.emit('channel_removed', channel);

    return true;
  }

  changeSetting(settingName: string, settingValue: unknown): boolean {
    if (!this.settings.hasOwnProperty(settingName)) {
      return false;
    }

    this.settings[settingName] = settingValue;

    this.emit('setting_changed', settingName, settingValue);

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
      const channels = _.map(this.channels, (channel) => {
        const saveChannel = {};

        _.forEach(channelSave, (settingName) => {
          if (channel.hasOwnProperty(settingName)) {
            saveChannel[settingName] = channel[settingName];
          }
        });

        return saveChannel;
      });

      const saveConfig = {
        channels,
        settings: this.settings,
      };

      fs.writeFileSync(settingsPath, JSON.stringify(saveConfig, null, 2));

      addLogs('settings saved.');

      return true;
    } catch (e) {
      addLogs(e);

      return false;
    }
  }
}
