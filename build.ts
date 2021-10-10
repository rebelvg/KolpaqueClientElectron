import * as packager from 'electron-packager';
import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';

const [, , platformArg, buildPathArg] = process.argv;

let platformOption;
let pathOption;

if (!platformArg) {
  platformOption = readlineSync.question(
    `select platform. all - for all platforms or win32, darwin, linux. (empty will default to current platform)${os.EOL}`,
  );
} else {
  platformOption = platformArg;
}

if (!buildPathArg) {
  pathOption = readlineSync.question(
    `select output folder. (empty will default to home dir)${os.EOL}`,
  );
}

process.on('unhandledRejection', (error) => {
  throw error;
});

(async (): Promise<void> => {
  const options = {
    dir: './',
    tmpdir: false,
    icon: './icons/icon',
    arch: 'x64',
    ignore: [
      /.git/,
      /.vscode/,
      /.idea/,
      /node_modules\/api/,
      /node_modules\/app/,
    ],
    overwrite: true,
    win32metadata: {
      ProductName: 'KolpaqueClientElectron',
      InternalName: 'KolpaqueClientElectron',
      FileDescription: 'KolpaqueClientElectron',
      OriginalFilename: 'KolpaqueClientElectron.exe',
    },
    asar: true,
    prune: true,
    out: null,
  };

  let platforms;

  if (platformOption === 'all') {
    platforms = ['win32', 'darwin', 'linux'];
  } else {
    platforms = [platformOption];
  }

  if (!pathOption) {
    pathOption = os.homedir();
  }

  if (!fs.existsSync(pathOption)) {
    throw new Error('bad_path');
  }

  pathOption = path.join(pathOption, 'KolpaqueClientElectron');

  // eslint-disable-next-line no-console
  console.log(options);

  for (const platform of platforms) {
    const appPaths = await packager({
      ...options,
      platform,
      out: pathOption,
    });

    for (const appPath of appPaths) {
      await new Promise((resolve) => {
        const folderName = path.basename(appPath);
        const archivePath = path.join(pathOption, `${folderName}.zip`);

        const archiveStream = fs.createWriteStream(archivePath);
        const archive = archiver('zip');

        archive.directory(appPath, folderName);
        archive.finalize();

        archiveStream.on('close', resolve);
        archive.pipe(archiveStream);
      });
    }

    // eslint-disable-next-line no-console
    console.log(appPaths);
  }
})();
