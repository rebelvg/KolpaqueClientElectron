import { ipcMain, dialog } from 'electron';
const _ = require('lodash');
const { URL } = require('url');
const childProcess = require('child_process');
import axios from 'axios';
import * as qs from 'querystring';

const config = require('./SettingsFile');
const Notifications = require('./Notifications');
const { twitchApiKey } = require('./Globals');
const { getInfoAsync } = require('./ChannelInfo');

const SERVICES = {
  'klpq-vps': getKlpqVpsStats,
  'klpq-main': getKlpqMainStats,
  twitch: getTwitchStats,
  'youtube-user': getYoutubeStatsUser,
  'youtube-channel': getYoutubeStatsChannel,
  chaturbate: getChaturbateStats
};

const SERVICES_INTERVALS = {
  'klpq-vps': {
    check: 5,
    confirmations: 0
  },
  'klpq-main': {
    check: 5,
    confirmations: 0
  },
  twitch: {
    check: 30,
    confirmations: 3
  },
  'youtube-user': {
    check: 120,
    confirmations: 3
  },
  'youtube-channel': {
    check: 120,
    confirmations: 3
  },
  chaturbate: {
    check: 120,
    confirmations: 3
  },
  custom: {
    check: 120,
    confirmations: 3
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
    Notifications.printNotification('Stream is Live', channelObj.visibleName, channelObj);
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
          function(res) {
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
  const url = `https://api.twitch.tv/kraken/streams?channel=${channelObj.name}`;

  const { data } = await axios.get(url, { headers: { 'Client-ID': twitchApiKey } });

  if (data.streams.length > 0) {
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

async function getChaturbateStats(channelObj, printBalloon) {
  const url = 'https://chaturbate.com/get_edge_hls_url_ajax';

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest'
  };

  try {
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
    } else {
      isOffline(channelObj);
    }
  } catch (e) {}
}

async function getYoutubeStatsChannel(channelObj, printBalloon) {
  const { youtubeApiKey } = config.settings;

  if (!youtubeApiKey) return;

  await getYoutubeStatsBase(channelObj.name, channelObj, printBalloon, youtubeApiKey);
}

async function checkChannel(channelObj, printBalloon = false) {
  try {
    if (SERVICES.hasOwnProperty(channelObj.service)) {
      await SERVICES[channelObj.service](channelObj, printBalloon);
    }
  } catch (e) {}
}

function checkLoop() {
  _.forEach(config.channels, channelObj => {
    checkChannel(channelObj, false);
  });

  _.forEach(SERVICES_INTERVALS, (service, serviceName) => {
    setInterval(async function() {
      for (const channelObj of config.channels) {
        if (channelObj.service === serviceName) {
          checkChannel(channelObj, true);
        }
      }
    }, service.check * 1000);
  });
}
