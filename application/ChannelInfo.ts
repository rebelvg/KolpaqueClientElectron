import axios from 'axios';
import * as _ from 'lodash';

import { twitchApiKey } from './Globals';
import { Channel } from './ChannelClass';
import { addLogs } from './Logs';

const SERVICES = {
  twitch: getTwitchInfoAsync
};

async function getTwitchInfoAsync(channelObjs: Channel[]) {
  const filteredChannels = _.filter(channelObjs, channelObj => !channelObj._icon);

  if (filteredChannels.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(filteredChannels, 100);

  await Promise.all(
    chunkedChannels.map(async channelObjs => {
      const { data: userData } = await axios.get(
        `https://api.twitch.tv/helix/users?${channelObjs.map(channel => `login=${channel.name}`).join('&')}`,
        {
          headers: { 'Client-ID': twitchApiKey }
        }
      );

      await Promise.all(
        channelObjs.map(async channelObj => {
          await Promise.all(
            userData.data.map(async user => {
              if (user.login !== channelObj.name) {
                return;
              }

              if (!_.get(user, 'profile_image_url')) return;

              try {
                const { data: logoData } = await axios.get(_.get(user, 'profile_image_url'), {
                  responseType: 'arraybuffer'
                });

                channelObj._icon = logoData;
              } catch (e) {
                addLogs(e);
              }
            })
          );
        })
      );
    })
  );
}

export async function getInfoAsync(channelObj: Channel) {
  if (SERVICES.hasOwnProperty(channelObj.service)) {
    await SERVICES[channelObj.service]([channelObj]);
  }
}
