import * as readlineSync from 'readline-sync';
import * as os from 'os';
import * as fs from 'fs';
import * as childProcess from 'child_process';

process.on('unhandledRejection', (error) => {
  throw error;
});

(() => {
  childProcess.execSync(`yarn run lint`, { stdio: 'inherit' });

  const packageJson = JSON.parse(
    fs.readFileSync('./package.json', { encoding: 'utf-8' }),
  );

  const newVersion = readlineSync.question(
    `current version - ${packageJson.version}${os.EOL}enter new version${os.EOL}`,
  );

  if (packageJson.version === newVersion) {
    throw new Error('version_is_same');
  }

  packageJson.version = newVersion;

  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

  childProcess.execSync(`yarn run lint:fix`, { stdio: 'inherit' });

  childProcess.execSync(`git add .`, { stdio: 'inherit' });

  childProcess.execSync(`git commit -m "publish version ${newVersion}"`, {
    stdio: 'inherit',
  });

  childProcess.execSync(`git tag ${newVersion}`, { stdio: 'inherit' });

  childProcess.execSync(`git push --tags --no-verify`, { stdio: 'inherit' });
})();
