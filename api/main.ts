import 'source-map-support/register';
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
import * as remoteMain from '@electron/remote/main';

fixPath();

import { config } from './settings-file';
import { launchPlayerLink } from './channel-play';
import { rebuildIconMenu } from './tray-icon';

import { addLogs, crashLogPath } from './logs';
import { init } from './client-init';
import { CLIENT_VERSION } from './globals';

const isDev = process.env.NODE_ENV === 'dev';

addLogs('info', 'is_dev', isDev, CLIENT_VERSION);

let forceQuit = false;

let initDone = false;

ipcMain.on('client_ready', async () => {
  addLogs('info', 'client_ready');

  if (initDone) {
    main.mainWindow!.webContents.send('backend_ready');

    return;
  }

  try {
    await init();
  } catch (error) {
    addLogs('error', 'init_failed', error);

    throw error;
  }

  main.mainWindow!.webContents.send('backend_ready');

  initDone = true;
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

export const main: { mainWindow: BrowserWindow | undefined } = {
  mainWindow: undefined,
};

app.setName('Kolpaque Client');

app.on('second-instance', () => {
  main.mainWindow!.show();
});

const lockStatus = app.requestSingleInstanceLock();

if (!lockStatus) {
  app.quit();
}

function createWindow(): void {
  remoteMain.initialize();

  const mainWindow = new BrowserWindow({
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
      contextIsolation: false,
    },
  });

  remoteMain.enable(mainWindow.webContents);

  main.mainWindow = mainWindow;

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:10000');

    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist-app', 'index.html'),
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
    addLogs('info', 'force_quit', forceQuit);

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
    main.mainWindow = undefined;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!main.mainWindow) {
    createWindow();
  }
});

app.on('ready', () => {
  if (!config.settings.minimizeAtStart) {
    return;
  }

  main.mainWindow!.hide();
});

export const contextMenuTemplate: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'Toggle Client',
    type: 'normal',
    visible: process.platform === 'linux',
    click: (): void => {
      main.mainWindow!.isVisible()
        ? main.mainWindow!.hide()
        : main.mainWindow!.show();
    },
  },
  {
    label: 'Online Channels',
    type: 'submenu',
    visible: true,
    submenu: [],
  },
  {
    label: 'Play / Clipboard',
    type: 'normal',
    visible: true,
    click: async (menuItem: MenuItem, browserWindow: BrowserWindow, event) => {
      await launchPlayerLink(clipboard.readText(), !!event.ctrlKey);
    },
  },
  {
    label: 'Notifications',
    type: 'checkbox',
    visible: true,
    click: (menuItem: MenuItem) => {
      config.changeSetting('showNotifications', menuItem.checked);
    },
    checked: config.settings.showNotifications,
  },
  {
    label: 'Quit Client',
    type: 'normal',
    visible: true,
    click: (): void => {
      forceQuit = true;

      app.quit();
    },
  },
];

function toggleHideClient(): void {
  main.mainWindow!.isVisible()
    ? main.mainWindow!.hide()
    : main.mainWindow!.show();
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
    addLogs('info', 'left_click_event');

    if (process.platform === 'darwin') {
      showTrayContextMenu();
    } else {
      toggleHideClient();
    }
  });

  appIcon.on('right-click', () => {
    addLogs('info', 'right_click_event');

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
  addLogs('info', 'unhandledRejection', err);

  throw err;
});

process.on('uncaughtException', (err) => {
  addLogs('info', 'uncaughtException', err);

  fs.appendFileSync(crashLogPath, `${err.stack}${os.EOL}`);

  throw err;
});
