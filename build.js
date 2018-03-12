const packager = require('electron-packager');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');
const os = require('os');

let platformOption = readlineSync.question('select platform. all - for all platforms. (empty for current)' + os.EOL);
let pathOption = readlineSync.question('select output folder. (empty for current)' + os.EOL);

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
    pathOption = __dirname;
}

if (!fs.existsSync(pathOption)) return console.log('bad path.');

options.out = path.join(pathOption, 'builds/KolpaqueClientElectron');

console.log(options);

packager(options, function (err, appPaths) {
    if (err) console.log(err);

    console.log(appPaths);
});
