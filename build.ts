import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';
import { Options, packager } from '@electron/packager';
import * as childProcess from 'child_process';

process.on('unhandledRejection', (error) => {
  throw error;
});

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
    `select output folder. (empty will default to tmp dir)${os.EOL}`,
  );
} else {
  pathOption = buildPathArg;
}

if (!pathOption) {
  pathOption = os.tmpdir();
}

(async (): Promise<void> => {
  await Promise.all(
    ['yarn run build:api', 'yarn run build:app'].map((command) => {
      return new Promise((resolve) => {
        const process = childProcess.spawn(command, {
          stdio: ['inherit', 'inherit', 'inherit'],
          shell: true,
        });

        process.on('exit', resolve);
      });
    }),
  );

  const options: Options = {
    dir: './',
    tmpdir: false,
    icon: './icons/icon.png',
    arch: 'x64',
    ignore: [
      /\/.git/,
      /\/.vscode/,
      /\/.idea/,
      /\/node_modules\/api/,
      /\/node_modules\/app/,
      /\/.config/,
      /\/.build/,
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

  if (!fs.existsSync(pathOption)) {
    throw new Error('no_folder');
  }

  // eslint-disable-next-line no-console
  console.log(options, pathOption);

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

      await fs.promises.cp(
        appPath,
        path.resolve(process.cwd(), '.build', path.basename(appPath)),
        {
          recursive: true,
        },
      );

      await fs.promises.copyFile(
        archivePath,
        path.resolve(process.cwd(), '.build', path.basename(archivePath)),
      );
    }
  }
})();
