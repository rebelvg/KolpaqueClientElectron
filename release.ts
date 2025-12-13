import * as readlineSync from 'readline-sync';
import * as os from 'os';
import * as fs from 'fs';
import * as childProcess from 'child_process';

process.on('unhandledRejection', (error) => {
  throw error;
});

(() => {
  const packageJson = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
  );

  const newVersion = readlineSync.question(
    `current version - ${packageJson.version}${os.EOL}enter new version${os.EOL}`,
  );

  if (!newVersion) {
    throw new Error('empty_version');
  }

  packageJson.version = newVersion;

  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

  const lastTag = childProcess
    .execSync(`git describe --tags --abbrev=0`, {
      encoding: 'utf-8',
    })
    .trim();

  // eslint-disable-next-line no-console
  console.log('lastTag', lastTag);

  const shortReleaseNote = readlineSync.question(
    `enter an additional commit note${os.EOL}`,
  );

  const changesList = childProcess
    .execSync(`git log "${lastTag}..HEAD" --pretty=format:"%s"`, {
      encoding: 'utf-8',
    })
    .trim()
    .split(os.EOL)
    .filter((line) => !line.startsWith('release'));

  changesList.unshift(`release ${newVersion}`);

  if (shortReleaseNote) {
    changesList.push(shortReleaseNote);
  }

  const commitNote = changesList.join(os.EOL);

  // eslint-disable-next-line no-console
  console.log(commitNote);

  childProcess.execSync(`yarn run lint:fix`, { stdio: 'inherit' });

  childProcess.execSync(`git add .`, { stdio: 'inherit' });

  childProcess.execSync(`git commit -m "${commitNote}"`, {
    stdio: 'inherit',
  });

  childProcess.execSync(`git tag ${newVersion}`, { stdio: 'inherit' });

  childProcess.execSync(`git push --no-verify`, { stdio: 'inherit' });

  childProcess.execSync(`git push --tags --no-verify`, { stdio: 'inherit' });
})();
