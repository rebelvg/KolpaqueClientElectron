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

app.commandLine.appendSwitch(
  'disable-features',
  'HardwareMediaKeyHandling,MediaSessionService',
);

fixPath();

import { config } from './settings-file';
import { launchPlayerLink } from './channel-play';
import { rebuildIconMenu } from './tray-icon';

import { addLogs, crashLogPath } from './logs';
import { init } from './client-init';
import { CLIENT_VERSION } from './globals';

addLogs(
  'info',
  'is_dev',
  process.env.NODE_ENV === 'dev',
  process.env.REACT_ENV === 'dev',
  CLIENT_VERSION,
);

let forceQuit = false;

let initDone = false;

ipcMain.on('client_ready', async () => {
  addLogs('info', 'client_ready');

  if (initDone) {
    main.mainWindow!.webContents.send('backend_ready');

    return;
  }

  initDone = true;

  const startTime = Date.now();

  try {
    await Promise.race([
      init(),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]);
  } catch (error) {
    addLogs('warn', 'init_failed', error);
  }

  addLogs('info', 'init_done', Date.now() - startTime);

  main.mainWindow!.webContents.send('backend_ready');
});

const iconPath = path.normalize(
  path.join(process.cwd(), './api/icons', 'klpq.png'),
);
let iconPathTray = path.normalize(
  path.join(process.cwd(), './api/icons', 'klpq.png'),
);

export const iconPathBalloon = path.normalize(
  path.join(process.cwd(), './api/icons', 'klpq.png'),
);

if (process.platform === 'darwin') {
  if (app.dock) {
    app.dock.setIcon(iconPath);
    app.dock.hide();
  }

  iconPathTray = path.normalize(
    path.join(process.cwd(), './api/icons', 'iconTemplate.png'),
  );
}

export const main: {
  mainWindow: BrowserWindow | undefined;
  createdWindows: BrowserWindow[];
} = {
  mainWindow: undefined,
  createdWindows: [],
};

app.setName('Kolpaque Client');
app.setAppUserModelId('Kolpaque Client');

if (process.env.NODE_ENV !== 'dev') {
  app.on('second-instance', () => {
    main.mainWindow!.show();
  });

  const lockStatus = app.requestSingleInstanceLock();

  if (!lockStatus) {
    app.quit();
  }
}

app.commandLine.appendSwitch('disable-http-cache');

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
      partition: 'nopersist',
    },
  });

  remoteMain.enable(mainWindow.webContents);

  main.mainWindow = mainWindow;

  mainWindow.setMenu(null);

  if (process.env.REACT_ENV === 'dev') {
    mainWindow.loadURL('http://localhost:10000');

    mainWindow.webContents.openDevTools({
      mode: 'detach',
    });
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(process.cwd(), './app/dist', 'index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  mainWindow.on('minimize', () => {
    addLogs('info', 'minimize', mainWindow.isVisible());

    mainWindow.hide();
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();

    addLogs('info', 'close', 'force_quit', forceQuit, mainWindow.isDestroyed());

    config.saveFile();

    if (forceQuit) {
      app.exit(0);

      return;
    }

    if (['darwin', 'linux'].includes(process.platform)) {
      mainWindow.hide();

      return;
    }

    const childWindows = main.createdWindows;

    addLogs('info', 'close', childWindows.length);

    for (const childWindow of childWindows) {
      if (!childWindow.isDestroyed()) {
        childWindow.close();
      }
    }

    app.exit(0);
  });

  mainWindow.on('resize', () => {
    config.settings.size = mainWindow.getSize();
  });

  mainWindow.on('closed', () => {
    addLogs('info', 'closed', forceQuit, mainWindow.isDestroyed());

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
    label: 'Hide/Show Client',
    type: 'normal',
    visible: process.platform === 'linux',
    click: (): void => {
      toggleHideClient();
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
      await launchPlayerLink(clipboard.readText('clipboard'), !!event.ctrlKey);
    },
  },
  {
    label: 'Notifications',
    type: 'checkbox',
    visible: true,
    click: async (menuItem: MenuItem) => {
      await config.changeSetting('showNotifications', menuItem.checked);
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

export function refreshTrayIconMenuLinux() {
  if (process.platform === 'linux') {
    appIcon.setContextMenu(rebuildIconMenu());
  }
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

  refreshTrayIconMenuLinux();

  appIcon.on('middle-click', () => {
    addLogs('info', 'middle_click_event');
  });

  appIcon.on('double-click', () => {
    addLogs('info', 'double_click_event');
  });

  appIcon.on('click', () => {
    addLogs('info', 'left_click_event');

    switch (process.platform) {
      case 'win32':
        toggleHideClient();

        break;
      case 'linux':
        toggleHideClient();

        break;
      case 'darwin':
        showTrayContextMenu();

        break;
      default:
        toggleHideClient();

        break;
    }
  });

  appIcon.on('right-click', () => {
    addLogs('info', 'right_click_event');

    switch (process.platform) {
      case 'win32':
        showTrayContextMenu();

        break;
      case 'linux':
        break;
      case 'darwin':
        toggleHideClient();

        break;
      default:
        showTrayContextMenu();

        break;
    }
  });

  if (['darwin'].includes(process.platform)) {
    const menu = defaultMenu(app, shell);

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  }
});

process.on('unhandledRejection', (err) => {
  addLogs('fatal', 'unhandledRejection', err);

  throw err;
});

process.on('uncaughtException', (err) => {
  addLogs('fatal', 'uncaughtException', err);

  fs.appendFileSync(crashLogPath, `${err.stack}${os.EOL}`);

  throw err;
});
