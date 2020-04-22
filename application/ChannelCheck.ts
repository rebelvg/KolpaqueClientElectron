import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';
import { URL } from 'url';
import axios from 'axios';
import * as qs from 'querystring';

import { config } from './SettingsFile';
import { twitchApiKey } from './Globals';
import { getInfoAsync } from './ChannelInfo';
import { printNotification } from './Notifications';
import { Channel } from './ChannelClass';
import { addLogs } from './Logs';

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

async function getKlpqStatsBase(url: string, channelObj: Channel, printBalloon: boolean) {
  const { data } = await axios.get(url);

  if (data.isLive) {
    isOnline(channelObj, printBalloon);
  } else {
    isOffline(channelObj);
  }
}

async function getKlpqVpsStats(channelObjs: Channel[], printBalloon: boolean) {
  await Promise.all(
    channelObjs.map(channelObj => {
      const url = `http://stats.klpq.men/api/nms/live/${channelObj.name}`;

      return getKlpqStatsBase(url, channelObj, printBalloon);
    })
  );
}

async function getTwitchStats(channelObjs: Channel[], printBalloon: boolean) {
  if (channelObjs.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(channelObjs, 100);

  await Promise.all(
    chunkedChannels.map(async channelObjs => {
      const channels = channelObjs.map(channelObj => {
        return {
          channelObj,
          userId: null
        };
      });

      const { data: userData } = await axios.get(
        `https://api.twitch.tv/helix/users?${channelObjs.map(channel => `login=${channel.name}`).join('&')}`,
        {
          headers: { 'Client-ID': twitchApiKey }
        }
      );

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

      const {
        data: streamData,
        headers
      } = await axios.get(
        `https://api.twitch.tv/helix/streams/?${existingChannels.map(({ userId }) => `user_id=${userId}`).join('&')}`,
        { headers: { 'Client-ID': twitchApiKey } }
      );

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

async function getYoutubeStatsBase(channelId: string, channelObj: Channel, printBalloon: boolean, apiKey: string) {
  const searchUrl = new URL(`https://www.googleapis.com/youtube/v3/search`);

  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('eventType', 'live');
  searchUrl.searchParams.set('key', apiKey);

  const { data } = await axios.get(searchUrl.href);

  if (data.items.length > 0) {
    isOnline(channelObj, printBalloon);
  } else {
    isOffline(channelObj);
  }
}

async function getYoutubeStatsUser(channelObjs: Channel[], printBalloon: boolean) {
  const { youtubeApiKey } = config.settings;

  if (!youtubeApiKey) return;

  await Promise.all(
    channelObjs.map(async channelObj => {
      const channelsUrl = new URL(`https://www.googleapis.com/youtube/v3/channels`);

      channelsUrl.searchParams.set('forUsername', channelObj.name);
      channelsUrl.searchParams.set('part', 'id');
      channelsUrl.searchParams.set('key', youtubeApiKey);

      const { data } = await axios.get(channelsUrl.href);

      if (data.items.length > 0) {
        const channelId = _.get(data, 'items[0].id');

        await getYoutubeStatsBase(channelId, channelObj, printBalloon, youtubeApiKey);
      }
    })
  );
}

async function getChaturbateStats(channelObjs: Channel[], printBalloon: boolean) {
  await Promise.all(
    channelObjs.map(async channelObj => {
      const url = 'https://chaturbate.com/get_edge_hls_url_ajax/';

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      };

      const { data } = await axios.post(
        url,
        qs.stringify({
          room_slug: channelObj.name,
          bandwidth: 'high'
        }),
        {
          headers
        }
      );

      if (data.room_status === 'public') {
        isOnline(channelObj, printBalloon);
        channelObj._customPlayUrl = data.url;
      } else {
        isOffline(channelObj);
        channelObj._customPlayUrl = null;
      }
    })
  );
}

async function getYoutubeStatsChannel(channelObjs: Channel[], printBalloon: boolean) {
  const { youtubeApiKey } = config.settings;

  if (!youtubeApiKey) return;

  await Promise.all(
    channelObjs.map(async channelObj => {
      await getYoutubeStatsBase(channelObj.name, channelObj, printBalloon, youtubeApiKey);
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
