import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(app.getAppPath(), './package.json'), {
    encoding: 'utf-8',
  }),
);

export const CLIENT_VERSION: string = packageJson.version;
