import { dialog } from 'electron';
import * as _ from 'lodash';
import * as childProcess from 'child_process';

import { config } from './settings-file';
import { printNotification } from './Notifications';
import { Channel } from './channel-class';
import { addLogs } from './Logs';
import {
  twitchClient,
  klpqStreamClient,
  youtubeClient,
  chaturbateClient,
  TWITCH_CHUNK_LIMIT,
} from './api-clients';
import { ServiceNamesEnum } from './Globals';

interface IServiceInterval {
  name: ServiceNamesEnum;
  check: number;
  confirmations: number;
  function: (channels: Channel[], printBalloon: boolean) => Promise<void>;
}

const SERVICES_INTERVALS: IServiceInterval[] = [
  {
    name: ServiceNamesEnum.KLPQ_VPS_RTMP,
    check: 5,
    confirmations: 0,
    function: getKlpqVpsStats,
  },
  {
    name: ServiceNamesEnum.KLPQ_VPS_HTTP,
    check: 5,
    confirmations: 0,
    function: getKlpqVpsStats,
  },
  {
    name: ServiceNamesEnum.TWITCH,
    check: 30,
    confirmations: 3,
    function: getTwitchStats,
  },
  {
    name: ServiceNamesEnum.YOUTUBE_USER,
    check: 120,
    confirmations: 3,
    function: getYoutubeStatsUser,
  },
  {
    name: ServiceNamesEnum.YOUTUBE_CHANNEL,
    check: 120,
    confirmations: 3,
    function: getYoutubeStatsChannel,
  },
  {
    name: ServiceNamesEnum.CHATURBATE,
    check: 120,
    confirmations: 3,
    function: getChaturbateStats,
  },
  {
    name: ServiceNamesEnum.CUSTOM,
    check: 120,
    confirmations: 3,
    function: getCustomStats,
  },
];

config.on('channel_added', async (channel: Channel) => {
  await checkChannels([channel], false);
});

config.on('channel_added_channels', async (channels: Channel[]) => {
  await checkChannels(channels, false);
});

function isOnline(channelObj: Channel, printBalloon: boolean): void {
  channelObj._offlineConfirmations = 0;

  if (channelObj.isLive) {
    return;
  }

  addLogs(`${channelObj.link} went online.`);

  if (printBalloon) {
    printNotification('Stream is Live', channelObj.visibleName, channelObj);
  }

  if (
    printBalloon &&
    config.settings.showNotifications &&
    channelObj.autoStart
  ) {
    if (channelObj._processes.length === 0) {
      if (config.settings.confirmAutoStart) {
        dialog
          .showMessageBox({
            type: 'none',
            message: `${channelObj.link} is trying to auto-start. Confirm?`,
            buttons: ['Ok', 'Cancel'],
          })
          .then(({ response }) => {
            if (response === 0) {
              channelObj.emit('play');
            }
          });
      } else {
        channelObj.emit('play');
      }
    }
  }

  channelObj.changeSettings({
    lastUpdated: Date.now(),
    isLive: true,
  });
}

function isOffline(channelObj: Channel): void {
  if (!channelObj.isLive) {
    return;
  }

  channelObj._offlineConfirmations++;

  if (
    channelObj._offlineConfirmations <
    _.get(SERVICES_INTERVALS, [channelObj.service, 'confirmations'], 0)
  ) {
    return;
  }

  addLogs(`${channelObj.link} went offline.`);

  channelObj.changeSettings({
    lastUpdated: Date.now(),
    isLive: false,
  });
}

async function getKlpqStatsBase(
  channelObj: Channel,
  printBalloon: boolean,
): Promise<void> {
  const channelData = await klpqStreamClient.getChannel(
    channelObj.name,
    channelObj.serviceObj.hosts[0],
  );

  if (!channelData) {
    return;
  }

  if (channelData.isLive) {
    isOnline(channelObj, printBalloon);
  } else {
    isOffline(channelObj);
  }
}

async function getKlpqVpsStats(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channelObjs.map((channelObj) => {
      return getKlpqStatsBase(channelObj, printBalloon);
    }),
  );
}

async function getTwitchStats(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await twitchClient.refreshAccessToken();

  const chunkedChannels = _.chunk(channelObjs, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async (channelObjs) => {
      const channels = channelObjs.map((channelObj) => {
        return {
          channelObj,
          userId: null,
        };
      });

      const userData = await twitchClient.getUsersByLogin(
        channelObjs.map((channel) => channel.name),
      );

      if (!userData) {
        return;
      }

      _.forEach(channels, (channel) => {
        _.forEach(userData.data, (user) => {
          if (user.login === channel.channelObj.name) {
            channel.userId = user.id;
          }
        });
      });

      const existingChannels = channels.filter((channel) => !!channel.userId);

      if (existingChannels.length === 0) {
        _.forEach(channels, ({ channelObj }) => {
          isOffline(channelObj);
        });

        return;
      }

      const streamData = await twitchClient.getStreams(
        existingChannels.map(({ userId }) => userId),
      );

      if (!streamData) {
        return;
      }

      _.forEach(channels, ({ channelObj, userId }) => {
        if (_.find(streamData.data, { user_id: userId })) {
          isOnline(channelObj, printBalloon);
        } else {
          isOffline(channelObj);
        }
      });
    }),
  );
}

async function getYoutubeStatsBase(channelId: string): Promise<boolean> {
  const data = await youtubeClient.getStreams(channelId);

  if (!data) {
    return;
  }

  if (data.items.length === 0) {
    return false;
  }

  return true;
}

async function getYoutubeStatsUser(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channelObjs.map(async (channelObj) => {
      const data = await youtubeClient.getChannels(channelObj.name);

      if (!data) {
        return;
      }

      const channelStatuses = await Promise.all(
        data.items.map(({ id }) => {
          return getYoutubeStatsBase(id);
        }),
      );

      if (_.some(channelStatuses)) {
        isOnline(channelObj, printBalloon);
      } else {
        isOffline(channelObj);
      }
    }),
  );
}

async function getYoutubeStatsChannel(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channelObjs.map(async (channelObj) => {
      const channelStatus = await getYoutubeStatsBase(channelObj.name);

      if (channelStatus) {
        isOnline(channelObj, printBalloon);
      } else {
        isOffline(channelObj);
      }
    }),
  );
}

async function getChaturbateStats(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    channelObjs.map(async (channelObj) => {
      const data = await chaturbateClient.getChannel(channelObj.name);

      if (data.room_status === 'public') {
        channelObj._customPlayUrl = data.url;

        isOnline(channelObj, printBalloon);
      } else {
        channelObj._customPlayUrl = null;

        isOffline(channelObj);
      }
    }),
  );
}

async function getCustomStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  const { useStreamlinkForCustomChannels } = config.settings;

  if (!useStreamlinkForCustomChannels) {
    return;
  }

  const chunkedChannels = _.chunk(channels, 1);

  for (const channelObjs of chunkedChannels) {
    await Promise.all(
      channelObjs.map((channelObj) => {
        return new Promise<void>((resolve) => {
          childProcess.execFile(
            'streamlink',
            [channelObj.link, 'best', '--twitch-disable-hosting', '--json'],
            (err, stdout) => {
              try {
                const res = JSON.parse(stdout);

                if (!res.error) {
                  isOnline(channelObj, printBalloon);
                } else {
                  isOffline(channelObj);
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

async function checkChannels(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await Promise.all(
    SERVICES_INTERVALS.map(async (service) => {
      const channels = _.filter(channelObjs, {
        service: service.name,
      });

      await service.function(channels, printBalloon);
    }),
  );
}

async function checkService(
  service: IServiceInterval,
  printBalloon: boolean,
): Promise<void> {
  try {
    const channels = _.filter(config.channels, {
      service: service.name,
    });

    await service.function(channels, printBalloon);
  } catch (error) {
    addLogs(error);
  }
}

async function checkServiceLoop(
  service: IServiceInterval,
  printBalloon: boolean,
): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(service.check * 1000);

    await checkService(service, printBalloon);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loop(): Promise<void> {
  await Promise.all(
    _.map(SERVICES_INTERVALS, (service) => checkService(service, false)),
  );

  _.forEach(SERVICES_INTERVALS, (service) => checkServiceLoop(service, true));
}
