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

  packageJson.version = newVersion;

  fs.writeFileSync('./package.json', JSON.stringify(packageJson));

  childProcess.execSync(`yarn run lint:fix`);

  childProcess.execSync(`git add .`);

  childProcess.execSync(`git commit -m 'publish version ${newVersion}'`);

  childProcess.execSync(`git tag ${newVersion}`);

  childProcess.execSync(`git push --tags`);
})();
