const electron = require('electron');
const {clipboard, shell, globalShortcut} = require('electron');
const SettingsFile = require('./application/SettingsFile');
const ChannelCheck = require('./application/ChannelCheck');
const ChannelPlay = require('./application/ChannelPlay');
const Notifications = require('./application/Notifications');
const isDev = process.env.NODE_ENV === 'dev';
console.log(isDev);
let settingsJson = SettingsFile.readFile();
let forceQuit = false;

require('electron-handlebars')({
    channels: settingsJson.channels,
    channels_count: Object.keys(settingsJson.channels).length,
    settings: settingsJson.settings,
    version: require('./package.json').version
});

let ipcMain = electron.ipcMain;

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

ipcMain.once('client-ready', function (bool) {
    console.log('client ready.');

    ChannelCheck.checkLoop(mainWindow);

    SettingsFile.saveLoop();
});

ipcMain.on('copy-clipboard', (event, channel) => {
    clipboard.writeText(channel);
});

const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

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

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    if (!isDev)
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.hbs'),
            protocol: 'file:',
            slashes: true
        }));
    else {
        mainWindow.loadURL(
            'http://localhost:3000'
        );
    }

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    mainWindow.on('minimize', function () {
        mainWindow.hide();
    });

    mainWindow.on('close', function () {
        SettingsFile.saveFile();
    });

    mainWindow.on('close', function (e) {
        console.log(forceQuit);

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

        let settingsJson = SettingsFile.settingsJson;
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

const {Menu, Tray, nativeImage} = require('electron');

let appIcon = null;
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
        label: 'Play Last Closed', type: 'normal', click: () => {
        ChannelPlay.launchLastClosed();
    }
    },
    {
        label: 'Play From Clipboard', type: 'normal', click: () => {
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

    Notifications.takeRef(appIcon, contextMenuTemplate);

    Notifications.rebuildIconMenu();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
