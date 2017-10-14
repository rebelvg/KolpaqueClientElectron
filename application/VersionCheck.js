const {app, ipcMain, dialog, shell} = require('electron');
const request = require('request');
const child = require('child_process').execFile;

const Notifications = require('./Notifications');

let buildsLink = 'https://github.com/rebelvg/KolpaqueClientElectron/releases';
let clientVersion = require('../package.json').version;

ipcMain.on('client_getInfo', (event) => {
    return shell.openExternal(buildsLink);
});

ipcMain.once('client_ready', () => {
    checkLoop();
});

function checkNewVersion() {
    let url = "https://api.github.com/repos/rebelvg/KolpaqueClientElectron/releases";

    request.get({url: url, json: true, headers: {'user-agent': "KolpaqueClientElectron"}}, function (err, res, body) {
        if (err) {
            return;
        }

        if (!body[0] || !body[0].tag_name) {
            return;
        }

        if (body[0].tag_name !== clientVersion) {
            Notifications.printNotification('Client Update Available', buildsLink);

            clientVersion = body[0].tag_name;

            app.mainWindow.webContents.send('client_showInfo', 'Client Update Available');
        }
    });
}

function streamlinkVersionCheck() {
    child('streamlink', ['--version-check'], function (err, data, stderr) {
        if (err) {
            console.log(err);
            return;
        }

        if (!data.includes('is up to date!')) {
            console.log(data);
            Notifications.printNotification('Streamlink Update Available', `https://github.com/streamlink/streamlink/releases`);
        }
    });
}

function checkLoop() {
    checkNewVersion();
    streamlinkVersionCheck();

    setInterval(checkNewVersion, 10 * 60 * 1000);
}
