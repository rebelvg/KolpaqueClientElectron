import * as _ from 'lodash';

import { Channel } from './ChannelClass';
import { addLogs } from './Logs';
import { twitchClient, commonClient } from './ApiClients';

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
      const userData = await twitchClient.getUsersByLogin(channelObjs.map(channel => channel.name));

      await Promise.all(
        channelObjs.map(async channelObj => {
          await Promise.all(
            userData?.data?.map(async user => {
              if (user.login !== channelObj.name) {
                return;
              }

              const profileImageUrl = user?.profile_image_url;

              if (!profileImageUrl) {
                return;
              }

              const logoBuffer = await commonClient.getContentAsBuffer(profileImageUrl);

              if (logoBuffer) {
                channelObj._icon = logoBuffer;
              }
            })
          );
        })
      );
    })
  );
}

export async function getInfoAsync(channelObj: Channel) {
  try {
    if (SERVICES.hasOwnProperty(channelObj.service)) {
      await SERVICES[channelObj.service]([channelObj]);
    }
  } catch (error) {
    addLogs(error);
  }
}
