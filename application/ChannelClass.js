const {ipcMain, shell, clipboard} = require('electron');
const {URL} = require('url');
const _ = require('lodash');

const {allowedProtocols, registeredServices} = require('./Globals');
const SettingsFile = require('./SettingsFile');

const channelValidate = ['visibleName', 'isPinned', 'autoStart', 'autoRestart'];

ipcMain.on('open-page', (event, channelLink) => {
    let channelObj = SettingsFile.settingsJson.findChannelByLink(channelLink);

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

ipcMain.on('open-chat', (event, channelLink) => {
    let channelObj = SettingsFile.settingsJson.findChannelByLink(channelLink);

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

ipcMain.on('copy-clipboard', (event, channelLink) => {
    clipboard.writeText(channelLink);

    return true;
});

class Channel {
    constructor(channelLink) {
        channelLink = channelLink.trim();

        this.service = 'custom';
        this.name = null;
        this.link = channelLink;
        this.protocol = null;
        this.isLive = false;

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
    }

    update(channelConfig) {
        _.forEach(channelConfig, (settingValue, settingName) => {
            if (channelValidate.includes(settingName)) {
                this[settingName] = settingValue;
            }
        });
    }
}

module.exports = Channel;