import axios from 'axios';

const { twitchApiKey } = require('./Globals');

const SERVICES = {
  twitch: getTwitchInfoAsync
};

async function getTwitchInfoAsync(channelObj) {
  if (channelObj._icon) return;

  const url = `https://api.twitch.tv/kraken/channels/${channelObj.name}`;

  try {
    const { data: channelData } = await axios.get(url, {
      headers: { 'Client-ID': twitchApiKey }
    });

    if (!channelData.logo) return;

    const { data: logoData } = await axios.get(channelData.logo, {
      responseType: 'arraybuffer'
    });

    channelObj._icon = logoData;
  } catch (e) {}
}

async function getInfoAsync(channelObj) {
  if (SERVICES.hasOwnProperty(channelObj.service)) {
    await SERVICES[channelObj.service](channelObj);
  }
}

module.exports.getInfoAsync = getInfoAsync;
