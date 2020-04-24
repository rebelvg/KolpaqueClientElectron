import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';

import { config } from './SettingsFile';
import { getInfoAsync } from './ChannelInfo';
import { printNotification } from './Notifications';
import { Channel } from './ChannelClass';
import { addLogs } from './Logs';
import { twitchClient, klpqStreamClient, youtubeClient, chaturbateClient, TWITCH_CHUNK_LIMIT } from './ApiClients';

const SERVICES_INTERVALS = {
  'klpq-vps': {
    check: 5,
    confirmations: 0,
    function: getKlpqVpsStats
  },
  twitch: {
    check: 30,
    confirmations: 3,
    function: getTwitchStats
  },
  'youtube-user': {
    check: 120,
    confirmations: 3,
    function: getYoutubeStatsUser
  },
  'youtube-channel': {
    check: 120,
    confirmations: 3,
    function: getYoutubeStatsChannel
  },
  chaturbate: {
    check: 120,
    confirmations: 3,
    function: getChaturbateStats
  },
  custom: {
    check: 120,
    confirmations: 3,
    function: () => {}
  }
};

ipcMain.once('client_ready', checkLoop);

config.on('channel_added', async channel => {
  console.log('channel_added');

  await checkChannels([channel], null, false);
});

config.on('channel_added_channels', async channels => {
  await checkChannels(channels, null, false);
});

async function isOnline(channelObj: Channel, printBalloon: boolean) {
  channelObj._offlineConfirmations = 0;

  if (channelObj.isLive) return;

  await getInfoAsync(channelObj);

  addLogs(`${channelObj.link} went online.`);

  if (printBalloon) {
    printNotification('Stream is Live', channelObj.visibleName, channelObj);
  }

  if (printBalloon && config.settings.showNotifications && channelObj.autoStart) {
    if (channelObj._processes.length === 0) {
      if (config.settings.confirmAutoStart) {
        dialog.showMessageBox(
          {
            type: 'none',
            message: `${channelObj.link} is trying to auto-start. Confirm?`,
            buttons: ['Ok', 'Cancel']
          },
          response => {
            if (response === 0) {
              channelObj.emit('play');
            }
          }
        );
      } else {
        channelObj.emit('play');
      }
    }
  }

  channelObj.changeSettings({
    lastUpdated: Date.now(),
    isLive: true
  });
}

function isOffline(channelObj: Channel) {
  if (!channelObj.isLive) return;

  channelObj._offlineConfirmations++;

  if (channelObj._offlineConfirmations < _.get(SERVICES_INTERVALS, [channelObj.service, 'confirmations'], 0)) return;

  addLogs(`${channelObj.link} went offline.`);

  channelObj.changeSettings({
    lastUpdated: Date.now(),
    isLive: false
  });
}

async function getKlpqStatsBase(channelObj: Channel, printBalloon: boolean) {
  const channelData = await klpqStreamClient.getChannel(channelObj.name);

  if (!channelData) {
    return;
  }

  if (channelData.isLive) {
    isOnline(channelObj, printBalloon);
  } else {
    isOffline(channelObj);
  }
}

async function getKlpqVpsStats(channelObjs: Channel[], printBalloon: boolean) {
  await Promise.all(
    channelObjs.map(channelObj => {
      return getKlpqStatsBase(channelObj, printBalloon);
    })
  );
}

async function getTwitchStats(channelObjs: Channel[], printBalloon: boolean) {
  if (channelObjs.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(channelObjs, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async channelObjs => {
      const channels = channelObjs.map(channelObj => {
        return {
          channelObj,
          userId: null
        };
      });

      const userData = await twitchClient.getUsersByLogin(channelObjs.map(channel => channel.name));

      if (!userData) {
        return;
      }

      _.forEach(channels, channel => {
        _.forEach(userData.data, user => {
          if (user.login === channel.channelObj.name) {
            channel.userId = user.id;
          }
        });
      });

      const existingChannels = channels.filter(channel => !!channel.userId);

      if (existingChannels.length === 0) {
        _.forEach(channels, ({ channelObj }) => {
          isOffline(channelObj);
        });

        return;
      }

      const streamData = await twitchClient.getStreams(existingChannels.map(({ userId }) => userId));

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
    })
  );
}

async function getYoutubeStatsBase(channelId: string) {
  const data = await youtubeClient.getStreams(channelId);

  if (!data) {
    return;
  }

  if (data.items.length === 0) {
    return false;
  }

  return true;
}

async function getYoutubeStatsUser(channelObjs: Channel[], printBalloon: boolean) {
  await Promise.all(
    channelObjs.map(async channelObj => {
      const data = await youtubeClient.getChannels(channelObj.name);

      if (!data) {
        return;
      }

      const channelStatuses = await Promise.all(
        data.items.map(({ id }) => {
          return getYoutubeStatsBase(id);
        })
      );

      if (_.some(channelStatuses)) {
        isOnline(channelObj, printBalloon);
      } else {
        isOffline(channelObj);
      }
    })
  );
}

async function getYoutubeStatsChannel(channelObjs: Channel[], printBalloon: boolean) {
  await Promise.all(
    channelObjs.map(async channelObj => {
      const channelStatus = await getYoutubeStatsBase(channelObj.name);

      if (channelStatus) {
        isOnline(channelObj, printBalloon);
      } else {
        isOffline(channelObj);
      }
    })
  );
}

async function getChaturbateStats(channelObjs: Channel[], printBalloon: boolean) {
  await Promise.all(
    channelObjs.map(async channelObj => {
      const data = await chaturbateClient.getChannel(channelObj.name);

      if (data.room_status === 'public') {
        channelObj._customPlayUrl = data.url;

        isOnline(channelObj, printBalloon);
      } else {
        channelObj._customPlayUrl = null;

        isOffline(channelObj);
      }
    })
  );
}

async function checkChannels(channelObjs: Channel[], service: string, printBalloon = false) {
  if (!service) {
    _.forEach(SERVICES_INTERVALS, async (service, serviceName) => {
      try {
        await service.function(_.filter(channelObjs, { service: serviceName }), printBalloon);
      } catch (error) {
        addLogs(error);
      }
    });

    return;
  }

  if (SERVICES_INTERVALS.hasOwnProperty(service)) {
    try {
      await SERVICES_INTERVALS[service].function(_.filter(channelObjs, { service }), printBalloon);
    } catch (error) {
      addLogs(error);
    }
  }
}

function checkLoop() {
  checkChannels(config.channels, null, false);

  _.forEach(SERVICES_INTERVALS, (service, serviceName) => {
    setInterval(() => {
      checkChannels(config.channels, serviceName, true);
    }, service.check * 1000);
  });
}
