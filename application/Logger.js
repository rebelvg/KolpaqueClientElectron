const {app, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logsPath = path.normalize(path.join(app.getPath('documents'), 'KolpaqueClient.log'));

function writeLine(text) {
    text.unshift(new Date());

    fs.appendFileSync(logsPath, text.join(' ') + os.EOL);
}

module.exports = writeLine;
