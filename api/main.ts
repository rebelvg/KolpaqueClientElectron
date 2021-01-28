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

import { addLogs, crashLogPath } from './logs';
import { init } from './client-init';

const isDev = process.env.NODE_ENV === 'dev';

addLogs('is_dev', isDev);

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

export const main: { mainWindow: BrowserWindow } = {
  mainWindow: null,
};

app.setName('Kolpaque Client');

app.on('second-instance', () => {
  main.mainWindow.show();
});

const lockStatus = app.requestSingleInstanceLock();

if (!lockStatus) {
  app.quit();
}

function createWindow(): void {
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
      enableRemoteModule: true,
    },
  });

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
    addLogs('force_quit', forceQuit);

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
    main.mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (main.mainWindow === null) {
    createWindow();
  }
});

app.on('ready', () => {
  if (!config.settings.minimizeAtStart) {
    return;
  }

  main.mainWindow.hide();
});

export const contextMenuTemplate: any[] = [
  {
    label: 'Toggle Client',
    type: 'normal',
    visible: process.platform === 'linux',
    click: (): void => {
      main.mainWindow.isVisible()
        ? main.mainWindow.hide()
        : main.mainWindow.show();
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
    click: async (
      menuItem: MenuItem,
      browserWindow: BrowserWindow,
      event: unknown,
    ) => {
      await launchPlayerLink(clipboard.readText(), (event as any).ctrlKey);
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
  main.mainWindow.isVisible() ? main.mainWindow.hide() : main.mainWindow.show();
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
    addLogs('left_click_event');

    if (process.platform === 'darwin') {
      showTrayContextMenu();
    } else {
      toggleHideClient();
    }
  });

  appIcon.on('right-click', () => {
    addLogs('right_click_event');

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
