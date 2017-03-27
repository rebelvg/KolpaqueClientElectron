const electron = require('electron');
const {clipboard} = require('electron');
const {shell} = require('electron');
const SettingsFile = require('./application/SettingsFile');
const ChannelCheck = require('./application/ChannelCheck');
const ChannelPlay = require('./application/ChannelPlay');
const Notifications = require('./application/Notifications');

let settingsJson = new SettingsFile().readFile();

require('electron-handlebars')({
    channels: settingsJson.channels,
    settings: settingsJson.settings,
    version: '0.1'
});

let ipcMain = electron.ipcMain;

ipcMain.on('add-channel', (event, channel) => {
    let channelObj = new SettingsFile().addChannel(channel.link);

    if (channelObj === false) {
        event.sender.send('add-channel-response', {status: false});
        return;
    }

    console.log('channel ' + channelObj.name + ' was added');

    event.sender.send('add-channel-response', {status: true, channel: channelObj});
});

ipcMain.on('channel-play', (event, channel) => {
    new ChannelPlay().launchPlayerLink(channel.link, channel.LQ);
});

ipcMain.on('open-page', (event, channel) => {
    if (channel.indexOf('klpq.men') >= 0) {
        shell.openExternal('http://stream.klpq.men/');
    }

    if (channel.startsWith('http')) {
        shell.openExternal(channel);
    }
});

ipcMain.on('open-chat', (event, channel) => {
    if (channel.indexOf('klpq.men') >= 0) {
        shell.openExternal('http://stream.klpq.men/chat/');
    }

    if (channel.startsWith('http')) {
        shell.openExternal(channel + '/chat');
    }
});

ipcMain.on('copy-clipboard', (event, channel) => {
    clipboard.writeText(channel);
});

ipcMain.on('remove-channel', (event, channel) => {
    let result = new SettingsFile().removeChannel(channel);

    console.log('channel ' + channel + ' was removed');

    event.sender.send('remove-channel-response', {status: result, channelLink: channel});
});

ipcMain.on('twitch-import', (event, channel) => {
    console.log('log - ' + channel);

    new ChannelCheck().twitchImport(channel);
});

ipcMain.on('change-setting', (event, setting) => {
    new SettingsFile().changeSetting(setting.name, setting.value);

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
        fullscreenable: false,
        icon: './icon.ico'
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

    mainWindow.on('minimize', function () {
        mainWindow.hide();
    });

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

app.on('ready', function () {
    if (!settingsJson.settings.minimizeAtStart)
        return;

    mainWindow.hide();
});

const {Menu, Tray} = require('electron');

let appIcon = null;
app.on('ready', () => {
    appIcon = new Tray('./icon.ico');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Play from Clipboard', type: 'normal', click: () => {
            new ChannelPlay().launchPlayerLink(clipboard.readText());
        }
        },
        {
            label: 'Close Client', type: 'normal', click: () => {
            app.quit();
        }
        }
    ]);

    appIcon.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    });

    appIcon.on('balloon-click', function () {
        new Notifications().onBalloonClick();
    });

    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu);

    new Notifications().takeIconReference(appIcon);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
