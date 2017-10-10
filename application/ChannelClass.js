const {app, ipcMain, shell, clipboard} = require('electron');
const {URL} = require('url');
const _ = require('lodash');
const EventEmitter = require('events');
const md5 = require('md5');

const {allowedProtocols, registeredServices} = require('./Globals');
const SettingsFile = require('./SettingsFile');

const channelValidate = ['visibleName', 'isPinned', 'autoStart', 'autoRestart'];

ipcMain.on('channel_openPage', (event, id) => {
    let channelObj = SettingsFile.settingsJson.findById(id);

    if (channelObj === null) {
        return false;
    }

    if (channelObj.protocol === 'rtmp:') {
        switch (channelObj.service) {
            case 'klpq-vps': {
                shell.openExternal('http://stream.klpq.men/' + channelObj.name);
                break;
            }
        }
    }

    if (['http:', 'https:'].includes(channelObj.protocol)) {
        shell.openExternal(channelObj.link);
    }

    return true;
});

ipcMain.on('channel_openChat', (event, id) => {
    let channelObj = SettingsFile.settingsJson.findById(id);

    if (channelObj === null) {
        return false;
    }

    if (channelObj.protocol === 'rtmp:') {
        switch (channelObj.service) {
            case 'klpq-vps': {
                shell.openExternal(`http://stream.klpq.men/chat`);
                break;
            }
        }
    }

    if (['http:', 'https:'].includes(channelObj.protocol)) {
        switch (channelObj.service) {
            case 'twitch': {
                shell.openExternal(`${channelObj.link}/chat`);
                break;
            }
        }
    }

    return true;
});

ipcMain.on('channel_copyClipboard', (event, channelLink) => {
    clipboard.writeText(channelLink);

    return true;
});

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
        this._processes = [];

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
            this.visibleName = this.link;
        }

        this.id = md5(this.link);

        this.on('setting_changed', (settingName, settingValue) => {
            app.mainWindow.webContents.send('channel_changeSetting', this.id, settingName, settingValue);
        });
    }

    update(channelConfig) {
        _.forEach(channelConfig, (settingValue, settingName) => {
            if (channelValidate.includes(settingName)) {
                this[settingName] = settingValue;
            }
        });
    }

    changeSetting(settingName, settingValue) {
        if (!this.hasOwnProperty(settingName)) {
            return false;
        }

        this[settingName] = settingValue;

        this.emit('setting_changed', settingName, settingValue);

        return true;
    }
}

module.exports = Channel;
