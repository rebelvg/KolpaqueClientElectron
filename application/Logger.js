const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment');

const logsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.log'));

function writeLine(...logs) {
    logs.unshift(moment().format('DD/MMM/YY HH:mm:ss.SSS'));

    fs.appendFileSync(logsPath, logs.join(' ') + os.EOL);
}

module.exports = writeLine;
