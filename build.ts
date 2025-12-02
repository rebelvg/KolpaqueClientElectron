import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';
import { Options, packager } from '@electron/packager';

const [, , platformArg, buildPathArg] = process.argv;

let platformOption: string | undefined;
let pathOption: string;

if (!platformArg) {
  platformOption = readlineSync.question(
    `select platform. all - for all platforms or win32, darwin, linux. (empty will default to current platform)${os.EOL}`,
  );
} else {
  if (platformArg !== 'CURRENT_OS') {
    platformOption = platformArg;
  }
}

if (!buildPathArg) {
  pathOption = readlineSync.question(
    `select output folder. (empty will default to home dir)${os.EOL}`,
  );
} else {
  pathOption = buildPathArg;
}

process.on('unhandledRejection', (error) => {
  throw error;
});

(async (): Promise<void> => {
  const options: Options = {
    dir: './',
    tmpdir: false,
    icon: './icons/icon.png',
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
    out: undefined,
  };

  let platforms;

  if (platformOption === 'all') {
    platforms = ['win32', 'darwin', 'linux'];
  } else {
    platforms = [platformOption];
  }

  if (!pathOption) {
    pathOption = path.resolve(
      os.homedir(),
      `${path.basename(__dirname)}-build`,
    );
  }

  if (!fs.existsSync(pathOption)) {
    fs.mkdirSync(pathOption);
  }

  pathOption = path.join(pathOption, 'KolpaqueClientElectron');

  // eslint-disable-next-line no-console
  console.log(options);

  for (const platform of platforms) {
    const appPaths: string[] = await packager({
      ...options,
      platform,
      out: pathOption,
    });

    for (const appPath of appPaths) {
      const archivePath = await new Promise<string>((resolve) => {
        const folderName = path.basename(appPath);
        const archivePath = path.join(pathOption, `${folderName}.zip`);

        const archiveStream = fs.createWriteStream(archivePath);
        const archive = archiver('zip');

        archive.directory(appPath, folderName);
        archive.finalize();

        archiveStream.on('close', () => resolve(archivePath));
        archive.pipe(archiveStream);
      });

      // eslint-disable-next-line no-console
      console.log('archiving_done', appPath, archivePath);
    }
  }
})();
