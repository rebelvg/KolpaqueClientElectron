const packager = require('electron-packager');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');

let platformOption = readlineSync.question('select platform. all - for all platforms. (empty for current)' + os.EOL);
let pathOption = readlineSync.question('select output folder. (empty for current)' + os.EOL);

childProcess.execSync('yarn run react-build', {
    stdio: 'inherit'
});

let options = {
    dir: './',
    tmpdir: false,
    icon: './icons/icon',
    arch: 'x64',
    ignore: [
        '.idea',
        'src'
    ],
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

if (platformOption === 'all') {
    options.platform = 'win32,darwin,linux';
} else {
    options.platform = platformOption;
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
    const appPaths = await packager(options);

    console.log(appPaths);
})();
