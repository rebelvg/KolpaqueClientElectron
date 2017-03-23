const electron = require('electron');
const SettingsFile = require('./application/SettingsFile');
let settingsJson = new SettingsFile().readFile();
let clientChannels = settingsJson.channels;
let clientSettings = settingsJson.settings;

const ChannelCheck = require('./application/ChannelCheck');
const ChannelPlay = require('./application/ChannelPlay');

require('electron-handlebars')({
    channels: clientChannels,
    settings: clientSettings
});

let ipcMain = electron.ipcMain;

ipcMain.on('add-channel', (event, channel) => {
    let channelObj = new SettingsFile().addChannel(channel.link);

    if (channelObj === false)
        return;

    console.log('channel ' + channelObj.name + ' was added');

    event.returnValue = {status: true, channel: channelObj};
});

ipcMain.on('change-setting', (event, setting) => {
    clientSettings[setting.name] = setting.value;
    console.log('setting ' + setting.name + ' changed to ' + setting.value);
});

const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 400,
        height: 667,
        resizable: false,
        fullscreenable: false
    });

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.hbs'),
        protocol: 'file:',
        slashes: true
    }));

    new ChannelCheck().checkLoop(mainWindow);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.on('close', function () {
        new SettingsFile().saveFile();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.

        mainWindow = null
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
