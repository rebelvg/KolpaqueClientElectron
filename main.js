const electron = require('electron');
const {app, BrowserWindow, clipboard, shell, globalShortcut, ipcMain, Menu, Tray, nativeImage} = require('electron');
const _ = require('lodash');
const fixPath = require('fix-path');

const ChannelCheck = require('./application/ChannelCheck');
const ChannelClass = require('./application/ChannelClass');
const ChannelPlay = require('./application/ChannelPlay');
const ConfigClass = require('./application/ConfigClass');
const Globals = require('./application/Globals');
const Import = require('./application/Import');
const Notifications = require('./application/Notifications');
const SettingsFile = require('./application/SettingsFile');
const VersionCheck = require('./application/VersionCheck');

const isDev = process.env.NODE_ENV === 'dev';
console.log('isDev', isDev);

let settingsJson = SettingsFile.settingsJson;
let forceQuit = false;
let appIcon = null;

let legacyChannels = SettingsFile.returnChannelsLegacy();

require('electron-handlebars')({
    channels: legacyChannels,
    channels_count: Object.keys(legacyChannels).length,
    settings: settingsJson.settings,
    version: require('./package.json').version
});

ipcMain.once('client_ready', () => {
    console.log('client ready.');

    fixPath();

    ChannelCheck.checkLoop();

    Import.importLoop();

    VersionCheck.checkLoop();
});

const path = require('path');
const url = require('url');

let iconPath = path.normalize(path.join(__dirname, 'icon.png'));
let iconPathTray = path.normalize(path.join(__dirname, 'icon32.png'));
let iconPathBalloon = path.normalize(path.join(__dirname, 'icon.png'));

if (process.platform === 'darwin') {
    app.dock.setIcon(iconPath);
    app.dock.hide();

    iconPathTray = path.normalize(path.join(__dirname, 'iconTemplate.png'));
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

app.setName('Kolpaque Client');

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: 'Kolpaque Client',
        minWidth: 200,
        minHeight: 350,
        width: settingsJson.settings.width,
        height: settingsJson.settings.height,
        resizable: true,
        fullscreenable: false,
        icon: iconPath
    });

    app.mainWindow = mainWindow;

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL(
        'http://localhost:3000'
    );

    if (isDev) {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('minimize', function () {
        mainWindow.hide();
    });

    mainWindow.on('close', function () {
        SettingsFile.saveFile();
    });

    mainWindow.on('close', function (e) {
        console.log('forceQuit', forceQuit);

        if (forceQuit)
            return;

        if (process.platform === 'darwin') {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('resize', function () {
        let size = mainWindow.getSize();

        let width = size[0];
        let height = size[1];

        //let settingsJson = SettingsFile.settingsJson;
        settingsJson.settings.width = width;
        settingsJson.settings.height = height;
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

let contextMenuTemplate = [
    {
        label: 'Toggle Client', type: 'normal', visible: process.platform === 'linux', click: () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
    },
    {
        label: 'Online Channels', type: 'submenu', submenu: []
    },
    {
        label: 'Play / Last Closed', type: 'normal', visible: false, click: () => {
        ChannelPlay.launchLastClosed();
    }
    },
    {
        label: 'Play / Clipboard', type: 'normal', click: () => {
        ChannelPlay.launchPlayerLink(clipboard.readText());
    }
    },
    {
        label: 'Close Client', type: 'normal', click: () => {
        forceQuit = true;
        app.quit();
    }
    }
];

app.contextMenuTemplate = contextMenuTemplate;

app.on('ready', () => {
    appIcon = new Tray(nativeImage.createFromPath(iconPathTray));
    appIcon.setToolTip('Kolpaque Client');
    appIcon.iconPathBalloon = iconPathBalloon;

    appIcon.on('click', () => {
        console.log('left-click event.');
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    });

    appIcon.on('right-click', () => {
        console.log('right-click event.');
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    });

    appIcon.on('balloon-click', function (balloon) {
        Notifications.onBalloonClick(appIcon.title, appIcon.content);
    });

    app.appIcon = appIcon;

    Notifications.rebuildIconMenu();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err.stack);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
