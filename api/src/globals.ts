import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const { name, version } = JSON.parse(
  fs.readFileSync(path.resolve(app.getAppPath(), './package.json'), {
    encoding: 'utf-8',
  }),
);

export const CLIENT_NAME: string = name;
export const CLIENT_VERSION: string = version;
