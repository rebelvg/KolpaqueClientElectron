import axios from 'axios';
import * as _ from 'lodash';

import { twitchApiKey } from './Globals';

const SERVICES = {
  twitch: getTwitchInfoAsync
};

async function getTwitchInfoAsync(channelObj) {
  if (channelObj._icon) return;

  const url = `https://api.twitch.tv/helix/users?login=${channelObj.name}`;

  try {
    const { data: channelData } = await axios.get(url, {
      headers: { 'Client-ID': twitchApiKey }
    });

    if (!_.get(channelData, 'data.0.profile_image_url')) return;

    const { data: logoData } = await axios.get(_.get(channelData, 'data.0.profile_image_url'), {
      responseType: 'arraybuffer'
    });

    channelObj._icon = logoData;
  } catch (e) {}
}

export async function getInfoAsync(channelObj) {
  if (SERVICES.hasOwnProperty(channelObj.service)) {
    await SERVICES[channelObj.service](channelObj);
  }
}
