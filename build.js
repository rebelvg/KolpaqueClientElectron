const packager = require('electron-packager');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');

let platformOption = readlineSync.question('select platform. all - for all platforms.\n');
let pathOption = readlineSync.question('select output folder.\n');

let options = {
    dir: './',
    tmpdir: false,
    icon: './icon',
    arch: 'x64',
    ignore: [
        '.idea'
    ],
    overwrite: true,
    win32metadata: {
        ProductName: 'KolpaqueClientElectron',
        InternalName: 'KolpaqueClientElectron',
        FileDescription: 'KolpaqueClientElectron',
        OriginalFilename: 'KolpaqueClientElectron.exe'
    },
    asar: {
        unpackDir: 'node_modules/node-notifier/vendor/**'
    },
    packageManager: 'yarn',
    prune: true
};

if (platformOption === 'all') {
    options.platform = 'win32,darwin,linux';
} else {
    options.platform = platformOption;
}

if (!fs.existsSync(pathOption))
    return console.log('bad path.');

options.out = path.join(pathOption, 'KolpaqueClientElectron');

console.log(options);

packager(options, function (err, appPaths) {
    if (err) console.log(err);

    console.log(appPaths);
});
