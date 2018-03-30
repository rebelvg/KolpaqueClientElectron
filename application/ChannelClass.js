const {app, ipcMain, shell, clipboard} = require('electron');
const {URL} = require('url');
const _ = require('lodash');
const EventEmitter = require('events');
const md5 = require('md5');

const {allowedProtocols, registeredServices} = require('./Globals');

const channelValidate = ['visibleName', 'isPinned', 'autoStart', 'autoRestart'];

class Channel extends EventEmitter {
    constructor(channelLink) {
        super();

        channelLink = channelLink.trim();

        this.id = null;
        this.service = 'custom';
        this.name = null;
        this.link = channelLink;
        this.protocol = null;
        this.isLive = false;
        this.onAutoRestart = false;
        this.lastUpdated = 0;
        this._processes = [];
        this._icon = null;
        this._autoRestartAttempts = 0;
        this._startTime = 0;

        this.visibleName = null;
        this.isPinned = false;
        this.autoStart = false;
        this.autoRestart = false;

        let channelURL = new URL(channelLink);

        if (!allowedProtocols.includes(channelURL.protocol)) {
            throw Error(`Only [${allowedProtocols}] are allowed.`);
        }

        this.protocol = channelURL.protocol;

        if (channelURL.host.length < 1) {
            throw Error(`Hostname can't be empty.`);
        }

        if (channelURL.pathname.length < 2) {
            throw Error(`Pathname can't be empty.`);
        }

        _.forEach(registeredServices, (serviceObj, serviceName) => {
            if (serviceObj.protocols.includes(channelURL.protocol.toLowerCase()) && serviceObj.hosts.includes(channelURL.host.toLowerCase())) {
                let nameArray = _.split(channelURL.pathname, '/');

                if (nameArray[serviceObj.name]) {
                    _.forEach(serviceObj.paths, (path) => {
                        if (channelURL.pathname.toLowerCase().indexOf(path) === 0) {
                            this.service = serviceName;
                            this.name = nameArray[serviceObj.name];
                            this.visibleName = this.name;

                            channelURL.protocol = serviceObj.protocols[0];
                            channelURL.host = serviceObj.hosts[0];
                            channelURL.path = serviceObj.paths[0] + nameArray[serviceObj.name];

                            this.link = channelURL.href;
                        }
                    });
                }
            }
        });

        if (this.service === 'custom') {
            this.name = this.link;
            this.visibleName = this.name;
        }

        this.id = md5(this.link);

        this.on('setting_changed', (settingName, settingValue, send) => {
            if (send) app.mainWindow.webContents.send('channel_changeSettingSync');
        });

        this.on('settings_changed', (send) => {
            if (send) app.mainWindow.webContents.send('channel_changeSettingSync');
        });
    }

    update(channelConfig) {
        _.forEach(channelConfig, (settingValue, settingName) => {
            if (channelValidate.includes(settingName)) {
                if (settingName === 'visibleName' && !settingValue) return;

                this[settingName] = settingValue;
            }
        });
    }

    changeSetting(settingName, settingValue, send = true) {
        if (!this.hasOwnProperty(settingName)) return false;

        this[settingName] = settingValue;

        this.emit('setting_changed', settingName, settingValue, send);

        return true;
    }

    changeSettings(settings, send = true) {
        _.forEach(settings, (settingValue, settingName) => {
            this.changeSetting(settingName, settingValue, false);
        });

        this.emit('settings_changed', send);

        return true;
    }
}

module.exports = Channel;
