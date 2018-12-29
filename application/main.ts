import { app, BrowserWindow, clipboard, shell, ipcMain, Menu, Tray, nativeImage } from 'electron';
import * as _ from 'lodash';
import * as path from 'path';
import * as url from 'url';
import * as fixPath from 'fix-path';
import * as defaultMenu from 'electron-default-menu';

fixPath();

import { config } from './SettingsFile';
import { launchPlayerLink } from './ChannelPlay';
import { rebuildIconMenu } from './TrayIcon';

import './ChannelCheck';
import './Import';
import './VersionCheck';

const isDev = process.env.NODE_ENV === 'dev';

console.log('isDev', isDev);

let forceQuit = false;

ipcMain.once('client_ready', () => {
  console.log('client ready.');
});

let iconPath = path.normalize(path.join(__dirname, '../icons', 'icon.png'));
let iconPathTray = path.normalize(path.join(__dirname, '../icons', 'icon32.png'));
let iconPathBalloon = path.normalize(path.join(__dirname, '../icons', 'icon.png'));

if (process.platform === 'darwin') {
  app.dock.setIcon(iconPath);
  app.dock.hide();

  iconPathTray = path.normalize(path.join(__dirname, '../icons', 'iconTemplate.png'));
}

let mainWindow;

app.setName('Kolpaque Client');

function createWindow() {
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

  (app as any).mainWindow = mainWindow;

  mainWindow.setMenu(null);

  if (isDev) {
    const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');

    mainWindow.loadURL('http://localhost:3000');

    mainWindow.webContents.openDevTools();

    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => console.log('Extension added', name))
      .catch(err => console.log('An error occurred', err));
    installExtension(REDUX_DEVTOOLS)
      .then(name => console.log('Extension added', name))
      .catch(err => console.log('An error occurred', err));
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  mainWindow.on('minimize', function() {
    mainWindow.hide();
  });

  mainWindow.on('close', function() {
    config.saveFile();
  });

  mainWindow.on('close', function(e) {
    console.log('forceQuit', forceQuit);

    if (forceQuit) return;

    if (process.platform === 'darwin') {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('resize', function() {
    config.settings.size = mainWindow.getSize();
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('ready', function() {
  if (!config.settings.minimizeAtStart) return;

  mainWindow.hide();
});

let contextMenuTemplate = [
  {
    label: 'Toggle Client',
    type: 'normal',
    visible: process.platform === 'linux',
    click: () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  },
  {
    label: 'Online Channels',
    type: 'submenu',
    submenu: []
  },
  {
    label: 'Play / Clipboard',
    type: 'normal',
    click: (menuItem, browserWindow, event) => {
      launchPlayerLink(clipboard.readText(), event.ctrlKey);
    }
  },
  {
    label: 'Notifications',
    type: 'checkbox',
    click: menuItem => {
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

(app as any).contextMenuTemplate = contextMenuTemplate;

let appIcon;

app.on('ready', () => {
  appIcon = new Tray(nativeImage.createFromPath(iconPathTray));
  appIcon.setToolTip('Kolpaque Client');
  appIcon.iconPathBalloon = iconPathBalloon;

  appIcon.on('click', () => {
    console.log('left-click event.');
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  appIcon.on('right-click', () => {
    console.log('right-click event.');
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  (app as any).appIcon = appIcon;

  rebuildIconMenu();

  if (process.platform === 'darwin') {
    const menu = defaultMenu(app, shell);

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  }
});

process.on('unhandledRejection', err => {
  console.error('unhandledRejection', err);
});

process.on('uncaughtException', err => {
  console.error('uncaughtException', err);
});
