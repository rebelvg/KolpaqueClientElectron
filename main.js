const electron = require('electron');
const {app, BrowserWindow, clipboard, shell, globalShortcut, ipcMain, Menu, Tray, nativeImage} = require('electron');
const _ = require('lodash');
const path = require('path');
const url = require('url');
const fixPath = require('fix-path');
const defaultMenu = require('electron-default-menu');

fixPath();

const config = require('./application/SettingsFile');

const ChannelPlay = require('./application/ChannelPlay');
const TrayIcon = require('./application/TrayIcon');
const Logger = require('./application/Logger');

require('./application/ChannelCheck');
require('./application/Import');
require('./application/ChannelInfo');
require('./application/VersionCheck');

const clientVersion = require('./package.json').version;

const isDev = process.env.NODE_ENV === 'dev';

console.log('isDev', isDev);

let forceQuit = false;

ipcMain.once('client_ready', () => {
    console.log('client ready.');
});

let iconPath = path.normalize(path.join(__dirname, 'icons', 'icon.png'));
let iconPathTray = path.normalize(path.join(__dirname, 'icons', 'icon32.png'));
let iconPathBalloon = path.normalize(path.join(__dirname, 'icons', 'icon.png'));

if (process.platform === 'darwin') {
    app.dock.setIcon(iconPath);
    app.dock.hide();

    iconPathTray = path.normalize(path.join(__dirname, 'icons', 'iconTemplate.png'));
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

app.setName('Kolpaque Client');

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: 'Kolpaque Client',
        minWidth: 300,
        minHeight: 400,
        width: config.settings.size[0],
        height: config.settings.size[1],
        resizable: true,
        fullscreenable: false,
        icon: iconPath
    });

    app.mainWindow = mainWindow;

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    if (isDev) {
        const {default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} = require('electron-devtools-installer');

        mainWindow.loadURL('http://localhost:3000');

        // Open the DevTools.
        mainWindow.webContents.openDevTools();
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log('Extension added', name))
            .catch((err) => console.log('An error occurred', err));
        installExtension(REDUX_DEVTOOLS)
            .then((name) => console.log('Extension added', name))
            .catch((err) => console.log('An error occurred', err));

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

        if (forceQuit) return;

        if (process.platform === 'darwin') {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('resize', function () {
        config.settings.size = mainWindow.getSize();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.

        _.forEach(config.channels, channel => {
            if (channel._window) {
                channel._window.close();
            }
        });

        mainWindow = null;
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
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('ready', function () {
    if (!config.settings.minimizeAtStart) return;

    mainWindow.hide();
});

let contextMenuTemplate = [
    {
        label: 'Toggle Client',
        type: 'normal',
        visible: process.platform === 'linux',
        click: () => {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        }
    },
    {
        label: 'Online Channels',
        type: 'submenu',
        submenu: []
    },
    {
        label: 'Play / Last Closed',
        type: 'normal',
        visible: false,
        click: () => {
        }
    },
    {
        label: 'Play / Clipboard',
        type: 'normal',
        click: (menuItem, browserWindow, event) => {
            ChannelPlay.launchPlayerLink(clipboard.readText(), event.ctrlKey);
        }
    },
    {
        label: 'Notifications',
        type: 'checkbox',
        click: (menuItem) => {
            console.log('menuItem.checked', menuItem.checked);
            config.changeSetting('showNotifications', menuItem.checked);
        },
        checked: config.settings.showNotifications
    },
    {
        label: 'Quit Client',
        type: 'normal',
        click: () => {
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

    TrayIcon.rebuildIconMenu();

    if (process.platform === 'darwin') {
        const menu = defaultMenu(app, shell);

        Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
    }
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err.stack);

    Logger(err.stack);
});
