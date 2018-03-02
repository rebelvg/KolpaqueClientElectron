const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const EventEmitter = require('events');
const moment = require('moment');

const Channel = require('./ChannelClass');
const {allowedProtocols, registeredServices, preInstalledChannels} = require('./Globals');

const settingsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.json'));
const channelSave = ['link', 'visibleName', 'isPinned', 'autoStart', 'autoRestart'];

const filterChannel = (channelObj, filter) => {
    filter = filter.trim();

    if (!filter) {
        return true;
    }

    let filters = filter.split(/\s+/gi);

    let searchFilters = _.map(filters, (filter) => {
        return {
            pattern: filter,
            found: false
        };
    });

    _.forEach([channelObj.link, channelObj.name, channelObj.visibleName], (searchString) => {
        _.forEach(searchFilters, (filter) => {
            let regExp = new RegExp(filter.pattern, 'gi');

            if (regExp.test(searchString)) {
                filter.found = true;
            }
        });
    });

    return _.filter(searchFilters, 'found').length === filters.length;
};

const filterChannels = (channels, filter) => {
    filter = filter.trim();

    if (!filter) {
        return channels;
    }

    let filteredChannels = [];

    filteredChannels = _.filter(channels, (channelObj) => {
        return filterChannel(channelObj, filter);
    });

    return filteredChannels;
};

const sortChannels = (channels, sortType, isReversed = false) => {
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

    sortedChannels = _.sortBy(sortedChannels, [(channel) => !channel.isPinned]);

    return sortedChannels;
};

function readFile(config) {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        let parseJson = JSON.parse(file);

        _.forEach(parseJson.channels, (channelObj) => {
            let channel = config.addChannelLink(channelObj.link);

            if (channel !== false) channel.update(channelObj);
        });

        _.forEach(config.settings, (settingValue, settingName) => {
            if (parseJson.settings.hasOwnProperty(settingName)) {
                config.settings[settingName] = parseJson.settings[settingName];
            }
        });
    }
    catch (e) {
        console.log(e.stack);

        _.forEach(preInstalledChannels, (channelLink) => {
            config.addChannelLink(channelLink);
        });
    }
}

function saveLoop(config) {
    setInterval(() => {
        config.saveFile();
    }, 5 * 60 * 1000);
}

class Config extends EventEmitter {
    constructor() {
        super();

        this.channels = [];
        this.settings = {
            LQ: false,
            showNotifications: true,
            minimizeAtStart: false,
            launchOnBalloonClick: true,
            size: [400, 800],
            youtubeApiKey: null,
            twitchImport: [],
            nightMode: false,
            sortType: 'lastAdded',
            sortReverse: false,
            showTooltips: true
        };

        readFile(this);

        saveLoop(this);

        this.on('channel_added', (channelObj) => {
            app.mainWindow.webContents.send('channel_add', channelObj);
        });

        this.on('channel_added', () => {
            app.mainWindow.webContents.send('channel_addSync');
        });

        this.on('channel_removed', (channelObj) => {
            app.mainWindow.webContents.send('channel_remove', channelObj.id);
        });

        this.on('channel_removed', () => {
            app.mainWindow.webContents.send('channel_removeSync');
        });

        this.on('setting_changed', (settingName, settingValue) => {
            app.mainWindow.webContents.send('config_changeSetting', settingName, settingValue);
        });

        this.on('setting_changed', () => {
            app.mainWindow.webContents.send('config_changeSettingSync', this.settings);
        });
    }

    addChannelLink(channelLink) {
        let channelObj = Config.buildChannelObj(channelLink);

        if (channelObj === false) return false;

        let res = this.findChannelByLink(channelObj.link);

        if (res !== null) return false;

        channelObj.lastUpdated = moment().unix();

        this.channels.push(channelObj);

        this.emit('channel_added', channelObj);

        return channelObj;
    }

    static buildChannelObj(channelLink) {
        try {
            return new Channel(channelLink);
        }
        catch (e) {
            console.log(e.stack);

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
        let channel = this.channels.find((channel) => {
            return channel.id === id;
        });

        if (!channel) return null;

        return channel;
    }

    findChannelByLink(channelLink) {
        let channel = this.channels.find((channel) => {
            return channel.link === channelLink;
        });

        if (!channel) return null;

        return channel;
    }

    find(query = {}) {
        const sort = {
            type: this.settings.sortType,
            isReversed: this.settings.isReversed
        };

        let filteredChannels = this.channels;

        if (_.isString(query.filter)) {
            filteredChannels = filterChannels(filteredChannels, query.filter);
        }

        filteredChannels = sortChannels(this.channels, sort.type, sort.isReversed);

        filteredChannels = _.map(filteredChannels, channel => {
            return {
                id: channel.id,
                service: channel.service,
                name: channel.name,
                link: channel.link,
                protocol: channel.protocol,
                isLive: channel.isLive,
                onAutoRestart: channel.onAutoRestart,
                lastUpdated: channel.lastUpdated,

                visibleName: channel.visibleName,
                isPinned: channel.isPinned,
                autoStart: channel.autoStart,
                autoRestart: channel.autoRestart
            };
        });

        return {
            channels: _.filter(filteredChannels, {'isLive': query.isLive}),
            count: {
                offline: _.filter(filteredChannels, {'isLive': false}).length,
                online: _.filter(filteredChannels, {'isLive': true}).length
            }
        };
    }

    saveFile() {
        try {
            let saveConfig = {};

            saveConfig.channels = _.map(this.channels, (channelObj) => {
                let channel = {};

                _.forEach(channelSave, (settingName) => {
                    if (channelObj.hasOwnProperty(settingName)) {
                        channel[settingName] = channelObj[settingName];
                    }
                });

                return channel;
            });

            saveConfig.settings = this.settings;

            fs.writeFileSync(settingsPath, JSON.stringify(saveConfig, null, 4));

            console.log('settings saved.');

            return true;
        }
        catch (e) {
            console.log(e.message);

            return false;
        }
    }
}

module.exports = Config;
