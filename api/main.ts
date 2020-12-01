import {
  app,
  BrowserWindow,
  clipboard,
  shell,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  MenuItem,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fixPath from 'fix-path';
import * as defaultMenu from 'electron-default-menu';
import * as fs from 'fs';
import * as os from 'os';

fixPath();

import { config } from './settings-file';
import { launchPlayerLink } from './channel-play';
import { rebuildIconMenu } from './tray-icon';
import './socket-client';
import './channel-info';

import './channel-check';
import './import';
import './version-check';
import './logs';
import { addLogs, crashLogPath } from './Logs';
import { init } from './client-init';

const isDev = process.env.NODE_ENV === 'dev';

addLogs('isDev', isDev);

let forceQuit = false;

ipcMain.once('client_ready', async () => {
  addLogs('client_ready');

  await init();

  addLogs('init_done');
});

const iconPath = path.normalize(path.join(__dirname, '../icons', 'icon.png'));
let iconPathTray = path.normalize(
  path.join(__dirname, '../icons', 'icon32.png'),
);

export const iconPathBalloon = path.normalize(
  path.join(__dirname, '../icons', 'icon.png'),
);

if (process.platform === 'darwin') {
  app.dock.setIcon(iconPath);
  app.dock.hide();

  iconPathTray = path.normalize(
    path.join(__dirname, '../icons', 'iconTemplate.png'),
  );
}

let mainWindow: BrowserWindow;

app.setName('Kolpaque Client');

app.on('second-instance', () => {
  mainWindow.show();
});

const lockStatus = app.requestSingleInstanceLock();

if (!lockStatus) {
  app.quit();
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'Kolpaque Client',
    minWidth: 300,
    minHeight: 400,
    width: config.settings.size[0],
    height: config.settings.size[1],
    resizable: true,
    fullscreenable: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  app['mainWindow'] = mainWindow;

  mainWindow.setMenu(null);

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
    } = require('electron-devtools-installer');

    mainWindow.loadURL('http://localhost:10000');

    mainWindow.webContents.openDevTools();

    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => addLogs('Extension added', name))
      .catch((err) => addLogs('An error occurred', err));
    installExtension(REDUX_DEVTOOLS)
      .then((name) => addLogs('Extension added', name))
      .catch((err) => addLogs('An error occurred', err));
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist-app/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });

  mainWindow.on('close', () => {
    config.saveFile();
  });

  mainWindow.on('close', (e) => {
    addLogs('forceQuit', forceQuit);

    if (forceQuit) {
      return;
    }

    if (process.platform === 'darwin') {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('resize', () => {
    config.settings.size = mainWindow.getSize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('ready', () => {
  if (!config.settings.minimizeAtStart) {
    return;
  }

  mainWindow.hide();
});

export const contextMenuTemplate: any[] = [
  {
    label: 'Toggle Client',
    type: 'normal',
    visible: process.platform === 'linux',
    click: (): void => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    },
  },
  {
    label: 'Online Channels',
    type: 'submenu',
    submenu: [],
  },
  {
    label: 'Play / Clipboard',
    type: 'normal',
    click: (
      menuItem: MenuItem,
      browserWindow: BrowserWindow,
      event: unknown,
    ): void => {
      launchPlayerLink(clipboard.readText(), (event as any).ctrlKey);
    },
  },
  {
    label: 'Notifications',
    type: 'checkbox',
    click: (menuItem: MenuItem): void => {
      config.changeSetting('showNotifications', menuItem.checked);
    },
    checked: config.settings.showNotifications,
  },
  {
    label: 'Quit Client',
    type: 'normal',
    click: (): void => {
      forceQuit = true;
      app.quit();
    },
  },
];

function toggleHideClient(): void {
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
}

function showTrayContextMenu(): void {
  const contextMenu = rebuildIconMenu();

  appIcon.popUpContextMenu(contextMenu);
}

let appIcon: Tray;

app.on('ready', () => {
  appIcon = new Tray(nativeImage.createFromPath(iconPathTray));
  appIcon.setToolTip('Kolpaque Client');
  appIcon.setIgnoreDoubleClickEvents(true);

  appIcon.on('click', () => {
    addLogs('left-click event.');

    if (process.platform === 'darwin') {
      showTrayContextMenu();
    } else {
      toggleHideClient();
    }
  });

  appIcon.on('right-click', () => {
    addLogs('right-click event.');

    if (process.platform === 'darwin') {
      toggleHideClient();
    } else {
      showTrayContextMenu();
    }
  });

  if (process.platform === 'darwin') {
    const menu = defaultMenu(app, shell);

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  }
});

process.on('unhandledRejection', (err) => {
  addLogs('unhandledRejection', err);

  throw err;
});

process.on('uncaughtException', (err) => {
  addLogs('uncaughtException', err);

  fs.appendFileSync(crashLogPath, `${err.stack}${os.EOL}`);

  throw err;
});
