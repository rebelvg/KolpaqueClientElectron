import * as _ from 'lodash';

import { Channel } from './ChannelClass';
import { addLogs } from './Logs';
import { twitchClient, commonClient, TWITCH_CHUNK_LIMIT } from './ApiClients';
import { config } from './SettingsFile';
import { ipcMain } from 'electron';

interface IServiceInfo {
  name: string;
  function: (channels: Channel[]) => {};
}

const SERVICES: IServiceInfo[] = [{ name: 'twitch', function: getTwitchInfoAsync }];

ipcMain.once('client_ready', checkLoop);

config.on('channel_added', async channel => {
  await checkChannels([channel]);
});

config.on('channel_added_channels', async (channels: Channel[]) => {
  await checkChannels(channels);
});

async function getTwitchInfoAsync(channelObjs: Channel[]) {
  await twitchClient.refreshAccessToken();

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

async function checkChannels(channelObjs: Channel[]) {
  await Promise.all(
    SERVICES.map(async service => {
      const channels = _.filter(channelObjs, { service: service.name });

      await service.function(channels);
    })
  );
}

async function checkLoop() {
  await Promise.all(
    _.map(SERVICES, async service => {
      const channels = _.filter(config.channels, { service: service.name });

      await service.function(channels);
    })
  );
}
