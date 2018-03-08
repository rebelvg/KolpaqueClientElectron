const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.log'));

function writeLine(...logs) {
    logs.unshift(new Date().toISOString());

    fs.appendFileSync(logsPath, logs.join(' ') + os.EOL);
}

module.exports = writeLine;
