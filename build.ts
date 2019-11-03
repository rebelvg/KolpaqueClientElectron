import { addLogs } from './application/Logs';

const packager = require('electron-packager');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');
const os = require('os');

let platformOption = readlineSync.question(`select platform. all - for all platforms. (empty for current)${os.EOL}`);
let pathOption = readlineSync.question(`select output folder. (empty for current)${os.EOL}`);

(async () => {
  const options = {
    dir: './',
    tmpdir: false,
    icon: './icons/icon',
    arch: 'x64',
    ignore: ['.git', '.vscode', '.idea', 'src'],
    overwrite: true,
    win32metadata: {
      ProductName: 'KolpaqueClientElectron',
      InternalName: 'KolpaqueClientElectron',
      FileDescription: 'KolpaqueClientElectron',
      OriginalFilename: 'KolpaqueClientElectron.exe'
    },
    asar: true,
    packageManager: 'yarn',
    prune: true,
    out: null
  };

  let platforms;

  if (platformOption === 'all') {
    platforms = ['win32', 'darwin', 'linux'];
  } else {
    platforms = [platformOption];
  }

  if (!pathOption) {
    pathOption = path.join(__dirname, 'builds');
  } else {
    if (!fs.existsSync(pathOption)) {
      addLogs('bad path.');

      return;
    }

    pathOption = path.join(pathOption, 'KolpaqueClientElectron');
  }

  options.out = pathOption;

  addLogs(options);

  for (const platform of platforms) {
    const appPaths = await packager({
      ...options,
      platform
    });

    addLogs(appPaths);
  }
})();
