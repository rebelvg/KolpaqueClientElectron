const electron = require('electron');
const {app, BrowserWindow, clipboard, shell, globalShortcut, ipcMain, Menu, Tray, nativeImage} = require('electron');
const _ = require('lodash');
const path = require('path');
const url = require('url');
const fixPath = require('fix-path');

const config = require('./application/SettingsFile');

const ChannelPlay = require('./application/ChannelPlay');
const Notifications = require('./application/Notifications');

const ChannelCheck = require('./application/ChannelCheck');
const Import = require('./application/Import');
const ChannelInfo = require('./application/ChannelInfo');
const VersionCheck = require('./application/VersionCheck');

const isDev = process.env.NODE_ENV === 'dev';
console.log('isDev', isDev);

let forceQuit = false;

ipcMain.once('client_ready', () => {
    console.log('client ready.');

    fixPath();
});

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
        width: config.settings.width,
        height: config.settings.height,
        resizable: true,
        fullscreenable: false,
        icon: iconPath
    });

    app.mainWindow = mainWindow;

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    if (isDev) {
        mainWindow.loadURL(
            'http://localhost:3000'
        );

        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }

    mainWindow.on('minimize', function () {
        mainWindow.hide();
    });

    mainWindow.on('close', function () {
        config.saveFile();
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

        config.settings.width = width;
        config.settings.height = height;
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
    if (!config.settings.minimizeAtStart)
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
        label: 'Play / Clipboard', type: 'normal', click: () => {
        ChannelPlay.launchPlayerLink(clipboard.readText());
    }
    },
    {
        label: 'Notifications', type: 'checkbox', click: (menuItem) => {
        console.log('menuItem.checked', menuItem.checked);
        config.changeSetting('showNotifications', menuItem.checked);
    }, checked: config.settings.showNotifications
    },
    {
        label: 'Quit Client', type: 'normal', click: () => {
        forceQuit = true;
        app.quit();
    }
    }
];

app.contextMenuTemplate = contextMenuTemplate;

let appIcon;
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

    app.appIcon = appIcon;

    Notifications.rebuildIconMenu();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err.stack);
});
