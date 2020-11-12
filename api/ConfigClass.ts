import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { EventEmitter } from 'events';

import { Channel } from './ChannelClass';
import { addLogs } from './Logs';

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

const filterChannel = (channelObj: Channel, filter: string): boolean => {
  filter = filter.trim();

  if (!filter) {
    return true;
  }

  const filters = filter.split(/\s+/gi);

  let searchFilters = _.map(filters, filter => {
    return {
      pattern: filter,
      found: false,
    };
  });

  _.forEach(
    [channelObj.link, channelObj.name, channelObj.visibleName],
    searchString => {
      _.forEach(searchFilters, filter => {
        let regExp = new RegExp(filter.pattern, 'gi');

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

  filteredChannels = _.filter(channels, channelObj => {
    return filterChannel(channelObj, filter);
  });

  return filteredChannels;
};

const sortChannels = (
  channels: Channel[],
  sortType: string,
  isReversed: boolean = false,
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

  sortedChannels = _.sortBy(sortedChannels, [channel => !channel.isPinned]);

  return sortedChannels;
};

export class Config extends EventEmitter {
  public channels: Channel[] = [];
  public settings = {
    LQ: false,
    showNotifications: true,
    minimizeAtStart: false,
    launchOnBalloonClick: true,
    size: [400, 800],
    twitchImport: [],
    nightMode: false,
    sortType: 'lastAdded',
    sortReverse: false,
    showTooltips: true,
    confirmAutoStart: true,
    playInWindow: false,
    useStreamlinkForCustomChannels: false,
    twitchRefreshToken: '',
    youtubeTosConsent: false,
    youtubeRefreshToken: '',
  };

  constructor() {
    super();

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

  private readFile() {
    try {
      let file = fs.readFileSync(settingsPath, 'utf8');

      let parseJson = JSON.parse(file);

      _.forEach(parseJson.channels, channelObj => {
        let channel = this.addChannelLink(channelObj.link, false);

        if (channel !== false) channel.update(channelObj);
      });

      _.forEach(this.settings, (settingValue, settingName) => {
        if (parseJson.settings.hasOwnProperty(settingName)) {
          this.settings[settingName] = parseJson.settings[settingName];
        }
      });
    } catch (error) {
      addLogs(error);
    }
  }

  private saveLoop() {
    setInterval(() => {
      this.saveFile();
    }, 5 * 60 * 1000);
  }

  addChannelLink(channelLink: string, emitEvent: boolean = true) {
    let channelObj = Config.buildChannelObj(channelLink);

    if (channelObj === false) return false;

    let res = this.findChannelByLink(channelObj.link);

    if (res !== null) return false;

    channelObj.lastUpdated = Date.now();

    this.channels.push(channelObj);

    if (emitEvent) {
      this.emit('channel_added', channelObj);
    }

    return channelObj;
  }

  static buildChannelObj(channelLink) {
    try {
      return new Channel(channelLink);
    } catch (e) {
      addLogs(e);

      return false;
    }
  }

  removeChannelById(id) {
    let channelObj = this.findById(id);

    if (!this.channels.includes(channelObj)) return true;

    _.pull(this.channels, channelObj);

    this.emit('channel_removed', channelObj);

    return true;
  }

  changeSetting(settingName, settingValue) {
    if (!this.settings.hasOwnProperty(settingName)) return false;

    this.settings[settingName] = settingValue;

    this.emit('setting_changed', settingName, settingValue);

    return true;
  }

  findById(id) {
    let channel = this.channels.find(channel => {
      return channel.id === id;
    });

    if (!channel) return null;

    return channel;
  }

  findChannelByLink(channelLink) {
    let channel = this.channels.find(channel => {
      return channel.link === channelLink;
    });

    if (!channel) return null;

    return channel;
  }

  find(query: any = {}): any {
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

  saveFile() {
    try {
      const channels = _.map(this.channels, channelObj => {
        let channel = {};

        _.forEach(channelSave, settingName => {
          if (channelObj.hasOwnProperty(settingName)) {
            channel[settingName] = channelObj[settingName];
          }
        });

        return channel;
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
