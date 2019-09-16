const packager = require('electron-packager');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');
const os = require('os');

let platformOption = readlineSync.question(`select platform. all - for all platforms. (empty for current)${os.EOL}`);
let pathOption = readlineSync.question(`select output folder. (empty for current)${os.EOL}`);

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
  prune: true
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
  if (!fs.existsSync(pathOption)) return console.log('bad path.');

  pathOption = path.join(pathOption, 'KolpaqueClientElectron');
}

options.out = pathOption;

console.log(options);

(async () => {
  for (const platform of platforms) {
    const appPaths = await packager({
      ...options,
      platform
    });

    console.log(appPaths);
  }
})();
