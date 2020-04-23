import * as packager from 'electron-packager';
import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let platformOption = readlineSync.question(`select platform. all - for all platforms. (empty for current)${os.EOL}`);
let pathOption = readlineSync.question(`select output folder. (empty for current)${os.EOL}`);

process.on('unhandledRejection', error => {
  throw error;
});

(async () => {
  const options = {
    dir: './',
    tmpdir: false,
    icon: './icons/icon',
    arch: 'x64',
    ignore: ['.git', '.vscode', '.idea', 'node_modules/application', 'node_modules/src'],
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
      console.error('bad path.');

      return;
    }

    pathOption = path.join(pathOption, 'KolpaqueClientElectron');
  }

  options.out = pathOption;

  console.log(options);

  for (const platform of platforms) {
    const appPaths = await packager({
      ...options,
      platform
    });

    console.log(appPaths);
  }
})();
