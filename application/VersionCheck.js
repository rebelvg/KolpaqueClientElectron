const {app, ipcMain, dialog, shell} = require('electron');
const request = require('request');
const child = require('child_process').execFile;
const _ = require('lodash');

const Notifications = require('./Notifications');
const clientVersion = require('../package.json').version;

const updates = {
    'client': {
        releaseLink: 'https://github.com/rebelvg/KolpaqueClientElectron/releases',
        interval: null
    },
    'streamlink': {
        releaseLink: 'https://github.com/streamlink/streamlink/releases',
        interval: null
    }
};

let infoArray = [];

ipcMain.on('client_getInfo', (event, info) => {
    _.forEach(infoArray, (value) => {
        if (updates.hasOwnProperty(value)) {
            shell.openExternal(updates[value].releaseLink);
        }
    });
});

ipcMain.once('client_ready', () => {
    checkLoop();
});

function sendInfo(update) {
    infoArray.push(update);

    Notifications.printNotification(`${_.capitalize(update)} Update Available`, updates[update].releaseLink);

    app.mainWindow.webContents.send('client_showInfo', infoArray.map(_.capitalize).join(' & ') + ' Update Available');
}

function clientVersionCheck() {
    if (infoArray.includes('client')) {
        return clearInterval(updates['client'].interval);
    }

    let url = "https://api.github.com/repos/rebelvg/KolpaqueClientElectron/releases";

    request.get({url: url, json: true, headers: {'user-agent': "KolpaqueClientElectron"}}, function (err, res, body) {
        if (err) {
            return;
        }

        if (!body[0] || !body[0].tag_name) {
            return;
        }

        let newVersion = body[0].tag_name;

        if (newVersion !== clientVersion) {
            sendInfo('client');
        }
    });
}

function streamlinkVersionCheck() {
    if (infoArray.includes('streamlink')) {
        return clearInterval(updates['streamlink'].interval);
    }

    child('streamlink', ['--version-check'], function (err, data, stderr) {
        if (err) {
            return;
        }

        if (!data.includes('is up to date!')) {
            sendInfo('streamlink');
        }
    });
}

function checkLoop() {
    clientVersionCheck();
    streamlinkVersionCheck();

    updates['client'].interval = setInterval(clientVersionCheck, 30 * 60 * 1000);
    updates['streamlink'].interval = setInterval(streamlinkVersionCheck, 30 * 60 * 1000);
}
