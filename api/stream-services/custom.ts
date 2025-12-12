import * as _ from 'lodash';
import * as childProcess from 'child_process';

import { Channel } from '../channel-class';
import { config } from '../settings-file';
import { addLogs } from '../logs';
import { BaseStreamService, ServiceNamesEnum } from './_base';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<undefined> {
  const { useStreamlinkForCustomChannels } = config.settings;

  if (!useStreamlinkForCustomChannels) {
    return;
  }

  const chunkedChannels = _.chunk(channels, 1);

  for (const channels of chunkedChannels) {
    await Promise.all(
      channels.map((channel) => {
        return new Promise<void>((resolve) => {
          childProcess.execFile(
            'streamlink',
            [channel.link, 'best', '--twitch-disable-hosting', '--json'],
            (err, stdout) => {
              if (err) {
                addLogs('error', err, stdout);

                return;
              }

              try {
                const res = JSON.parse(stdout);

                if (!res.error) {
                  channel.setOnline(printBalloon);
                } else {
                  channel.setOffline();
                }
              } catch (error) {
                addLogs('error', error, stdout);
              }

              resolve();
            },
          );
        });
      }),
    );
  }
}

class CustomStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.CUSTOM;
  public protocols = [];
  public hosts = [];
  public paths = [];
  public checkLiveTimeout = 120;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public buildChannelLink(channelName: string) {
    return `${channelName}`;
  }
}

export const customStreamService = new CustomStreamService();
