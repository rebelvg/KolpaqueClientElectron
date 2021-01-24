import * as _ from 'lodash';
import * as childProcess from 'child_process';

import { Channel } from '../channel-class';
import { config } from '../settings-file';
import { addLogs } from '../logs';
import { BaseStreamService, ServiceNamesEnum } from './_base';

async function getCustomStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
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
              try {
                const res = JSON.parse(stdout);

                if (!res.error) {
                  channel.setOnline(printBalloon);
                } else {
                  channel.setOffline();
                }
              } catch (error) {
                addLogs(error);
              }

              resolve();
            },
          );
        });
      }),
    );
  }
}

export class CustomStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.CUSTOM;
  public protocols = [];
  public hosts = [];
  public paths = [];
  public channelNamePath = 0;
  public embedLink = (channel: Channel) => {
    return channel.link;
  };
  public chatLink = () => null;
  public icon = null;
  public play = (channel: Channel) => {
    return {
      playLink: channel._customPlayUrl || channel.link,
      params: [],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params,
    };
  };
  public checkLiveTimeout = 120;
  public checkLiveConfirmation = 3;
  public checkChannels = getCustomStats;
  public getInfo = () => null;
}
