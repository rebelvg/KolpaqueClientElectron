import * as _ from 'lodash';

import { Channel } from './ChannelClass';
import { addLogs } from './Logs';
import { twitchClient, commonClient, TWITCH_CHUNK_LIMIT } from './ApiClients';
import { config } from './SettingsFile';
import { ipcMain } from 'electron';

const SERVICES = {
  twitch: getTwitchInfoAsync
};

ipcMain.once('client_ready', checkLoop);

config.on('channel_added', async channel => {
  await checkChannels([channel], null);
});

config.on('channel_added_channels', async (channels: Channel[]) => {
  await checkChannels(channels, null);
});

async function getTwitchInfoAsync(channelObjs: Channel[]) {
  const filteredChannels = _.filter(channelObjs, channelObj => !channelObj._icon);

  if (filteredChannels.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(filteredChannels, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async channelObjs => {
      const userData = await twitchClient.getUsersByLogin(channelObjs.map(channel => channel.name));

      await Promise.all(
        channelObjs.map(async channelObj => {
          await Promise.all(
            _.map(userData?.data, async user => {
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

async function checkChannels(channelObjs: Channel[], service: string) {
  if (SERVICES.hasOwnProperty(service)) {
    try {
      await SERVICES[service](_.filter(channelObjs, { service }));
    } catch (error) {
      addLogs(error);
    }
  }
}

async function checkLoop() {
  await Promise.all(
    _.map(SERVICES, async (checkFnc, service) => {
      await checkChannels(config.channels, service);
    })
  );
}
