/**
 * Created by rebel on 21/03/2017.
 */

const {app, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const lodash = require('lodash');
const Notifications = require('./Notifications');
const {URL} = require('url');

let settingsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.json'));
let settingsJson = {};

const preInstalledChannels = ['rtmp://main.klpq.men/live/main'];

const allowedProtocols = ['rtmp:', 'http:', 'https:'];
const registeredServices = {
    'klpq-main': {
        protocols: ['rtmp:'],
        hosts: ['main.klpq.men', 'stream.klpq.men'],
        paths: ['/live/'],
        name: 2
    },
    'twitch': {
        protocols: ['https:', 'http:'],
        hosts: ['www.twitch.tv', 'twitch.tv'],
        paths: ['/'],
        name: 1
    },
    'youtube-user': {
        protocols: ['https:', 'http:'],
        hosts: ['www.youtube.com', 'youtube.com'],
        paths: ['/user/'],
        name: 2
    },
    'youtube-channel': {
        protocols: ['https:', 'http:'],
        hosts: ['www.youtube.com', 'youtube.com'],
        paths: ['/channel/'],
        name: 2
    }
};

ipcMain.on('change-setting', (event, setting) => {
    changeSetting(setting.name, setting.value);

    console.log('setting ' + setting.name + ' changed to ' + setting.value);
});

ipcMain.on('add-channel', (event, channel) => {
    let channelObj = addChannel(channel.link);

    if (channelObj === false) {
        event.sender.send('add-channel-response', {status: false});
        return;
    }

    console.log('channel ' + channelObj.name + ' was added');

    event.sender.send('add-channel-response', {status: true, channel: channelObj});
});

ipcMain.on('remove-channel', (event, channel) => {
    let result = removeChannel(channel);

    event.sender.send('remove-channel-response', {status: result, channelLink: channel});
});

let defaultSettings = {
    channels: {},
    settings: {
        livestreamerPath: "C:\\Program Files (x86)\\Streamlink\\bin\\streamlink.exe",
        LQ: false,
        showNotifications: true,
        autoPlay: false,
        minimizeAtStart: false,
        launchOnBalloonClick: true,
        enableLog: false,
        theme: "light",
        width: 400,
        height: 700,
        youtubeApiKey: null,
        twitchImport: []
    }
};

function readFile() {
    try {
        let file = fs.readFileSync(settingsPath, 'utf8');

        let parseJson = JSON.parse(file);

        settingsJson.channels = {};
        settingsJson.settings = defaultSettings.settings;

        _.forEach(parseJson.channels, function (channelObj, channelLink) {
            channelObj = buildChannelObj(channelLink);

            if (channelObj !== false) {
                settingsJson.channels[channelObj.link] = channelObj;
            }
        });

        _.forEach(defaultSettings.settings, function (value, key) {
            if (parseJson.settings.hasOwnProperty(key)) {
                settingsJson.settings[key] = parseJson.settings[key];
            }
        });

        return settingsJson;
    }
    catch (e) {
        console.log(e.message);

        settingsJson.channels = {};
        settingsJson.settings = defaultSettings.settings;

        preInstalledChannels.forEach(addChannel);

        return settingsJson;
    }
}

function saveFile() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settingsJson, null, 4));
        console.log('settings saved.');
    }
    catch (e) {
        console.log(e.message);
    }
}

function buildChannelObj(channelLink) {
    let channelObj = {
        service: 'custom',
        name: null,
        link: channelLink,
        protocol: null
    };

    try {
        let channelURL = new URL(channelLink);

        if (!allowedProtocols.includes(channelURL.protocol)) {
            throw Error(`Only [${allowedProtocols}] are allowed.`);
        }

        channelObj.protocol = channelURL.protocol;

        if (channelURL.host.length < 1) {
            throw Error(`Hostname can't be empty.`);
        }

        if (channelURL.pathname.length < 2) {
            throw Error(`Pathname can't be empty.`);
        }

        lodash.forEach(registeredServices, function (serviceObj, serviceName) {
            if (serviceObj.protocols.includes(channelURL.protocol.toLowerCase()) && serviceObj.hosts.includes(channelURL.host.toLowerCase())) {
                let nameArray = lodash.split(channelURL.pathname, '/');

                if (nameArray[serviceObj.name]) {
                    lodash.forEach(serviceObj.paths, function (path) {
                        if (channelURL.pathname.toLowerCase().indexOf(path) === 0) {
                            channelObj.service = serviceName;
                            channelObj.name = nameArray[serviceObj.name];

                            channelURL.protocol = serviceObj.protocols[0];
                            channelURL.host = serviceObj.hosts[0];
                            channelURL.path = serviceObj.paths[0] + `${nameArray[serviceObj.name]}`;

                            channelObj.link = channelURL.href;
                        }
                    });
                }
            }
        });
    }
    catch (e) {
        console.log(e.message);
        return false;
    }

    return channelObj;
}

function addChannel(channelLink, printError = true) {
    channelLink = channelLink.replace(/\s+/g, '');

    try {
        let channelObj = buildChannelObj(channelLink);

        if (channelObj === false) {
            throw Error('Error adding channel.');
        }

        if (settingsJson.channels.hasOwnProperty(channelObj.link))
            return false;

        let channels = {};

        channels[channelObj.link] = channelObj;

        _.extend(settingsJson.channels, channels);

        console.log('added channel.', channelObj);

        return channelObj;
    }
    catch (e) {
        if (printError) {
            dialog.showMessageBox({
                type: 'error',
                message: e.message
            });
        }

        return false;
    }
}

function removeChannel(channelLink) {
    if (!settingsJson.channels.hasOwnProperty(channelLink))
        return true;

    delete settingsJson.channels[channelLink];

    let {onlineChannels} = require('./ChannelCheck');

    if (onlineChannels.hasOwnProperty(channelLink)) {
        delete onlineChannels[channelLink];
    }

    Notifications.rebuildIconMenu(Object.keys(onlineChannels));

    return true;
}

function saveLoop() {
    setInterval(saveFile, 5 * 60 * 1000);
}

function changeSetting(settingName, settingValue) {
    settingsJson.settings[settingName] = settingValue;
}

function returnSettings() {
    return settingsJson;
}

exports.readFile = readFile;
exports.saveFile = saveFile;
exports.addChannel = addChannel;
exports.removeChannel = removeChannel;
exports.changeSetting = changeSetting;
exports.returnSettings = returnSettings;
exports.saveLoop = saveLoop;
exports.settingsJson = settingsJson;
exports.buildChannelObj = buildChannelObj;
exports.registeredServices = registeredServices;
