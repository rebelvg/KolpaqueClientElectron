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

const SERVICES_INTERVALS = {
  'klpq-vps': {
    check: 5,
    confirmations: 0,
    function: getKlpqVpsStats
  },
  'klpq-main': {
    check: 5,
    confirmations: 0,
    function: () => {}
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

config.on('channel_added', checkChannel);

async function isOnline(channelObj, printBalloon) {
  channelObj._offlineConfirmations = 0;

  if (channelObj.isLive) return;

  await getInfoAsync(channelObj);

  console.log(`${channelObj.link} went online.`);

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
          res => {
            if (res === 0) {
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

function isOffline(channelObj) {
  if (!channelObj.isLive) return;

  channelObj._offlineConfirmations++;

  if (channelObj._offlineConfirmations < _.get(SERVICES_INTERVALS, [channelObj.service, 'confirmations'], 0)) return;

  console.log(`${channelObj.link} went offline.`);

  channelObj.changeSettings({
    lastUpdated: Date.now(),
    isLive: false
  });
}

async function getKlpqStatsBase(url, channelObj, printBalloon) {
  const { data } = await axios.get(url);

  if (data.isLive) {
    isOnline(channelObj, printBalloon);
  } else {
    isOffline(channelObj);
  }
}

async function getKlpqVpsStats(channelObj, printBalloon) {
  const url = `http://stats.vps.klpq.men/channel/${channelObj.name}`;

  await getKlpqStatsBase(url, channelObj, printBalloon);
}

async function getKlpqMainStats(channelObj, printBalloon) {
  const url = `http://stats.main.klpq.men/channel/${channelObj.name}`;

  await getKlpqStatsBase(url, channelObj, printBalloon);
}

async function getTwitchStats(channelObj, printBalloon) {
  const url = `https://api.twitch.tv/helix/streams/?user_login=${channelObj.name}`;

  const { data: streamData } = await axios.get(url, { headers: { 'Client-ID': twitchApiKey } });

  if (streamData.data.length > 0) {
    isOnline(channelObj, printBalloon);
  } else {
    isOffline(channelObj);
  }
}

async function getYoutubeStatsBase(channelId, channelObj, printBalloon, apiKey) {
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

async function getYoutubeStatsUser(channelObj, printBalloon) {
  const { youtubeApiKey } = config.settings;

  if (!youtubeApiKey) return;

  const channelsUrl = new URL(`https://www.googleapis.com/youtube/v3/channels`);

  channelsUrl.searchParams.set('forUsername', channelObj.name);
  channelsUrl.searchParams.set('part', 'id');
  channelsUrl.searchParams.set('key', youtubeApiKey);

  const { data } = await axios.get(channelsUrl.href);

  if (data.items.length > 0) {
    const channelId = _.get(data, 'items[0].id');

    await getYoutubeStatsBase(channelId, channelObj, printBalloon, youtubeApiKey);
  }
}

async function getChaturbateStats(channelObj: Channel, printBalloon) {
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
}

async function getYoutubeStatsChannel(channelObj, printBalloon) {
  const { youtubeApiKey } = config.settings;

  if (!youtubeApiKey) return;

  await getYoutubeStatsBase(channelObj.name, channelObj, printBalloon, youtubeApiKey);
}

async function checkChannel(channelObj, printBalloon = false) {
  try {
    if (SERVICES_INTERVALS.hasOwnProperty(channelObj.service)) {
      await SERVICES_INTERVALS[channelObj.service].function(channelObj, printBalloon);
    }
  } catch (e) {
    console.error(e.message);
  }
}

function checkLoop() {
  _.forEach(config.channels, channelObj => {
    checkChannel(channelObj, false);
  });

  _.forEach(SERVICES_INTERVALS, (service, serviceName) => {
    setInterval(async () => {
      for (const channelObj of config.channels) {
        if (channelObj.service === serviceName) {
          checkChannel(channelObj, true);
        }
      }
    }, service.check * 1000);
  });
}
