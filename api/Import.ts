import { ipcMain, dialog } from 'electron';
import * as _ from 'lodash';

import { config } from './settings-file';
import { Channel } from './channel-class';
import {
  twitchClient,
  ITwitchFollowedChannel,
  TWITCH_CHUNK_LIMIT,
} from './api-clients';
import { sleep } from './channel-check';

ipcMain.on('config_twitchImport', (event, channelName) => {
  return twitchImport(channelName);
});

async function twitchImportChannels(
  channels: ITwitchFollowedChannel[],
): Promise<{
  channelsAdded: Channel[];
}> {
  const channelsAdded = [];

  const chunkedChannels = _.chunk(channels, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async (channels) => {
      const userData = await twitchClient.getUsersById(
        channels.map((channel) => channel.to_id),
      );

      if (!userData) {
        return;
      }

      for (const channel of userData.data) {
        const channelObj = config.addChannelLink(
          `https://twitch.tv/${channel.login}`,
          false,
        );

        if (channelObj) {
          channelsAdded.push(channelObj);
        }
      }
    }),
  );

  return {
    channelsAdded,
  };
}

async function twitchImportBase(
  channelName: string,
  emitEvent: boolean,
): Promise<number> {
  await twitchClient.refreshAccessToken();

  if (!channelName) {
    return 0;
  }

  channelName = channelName.trim();

  const userData = await twitchClient.getUsersByLogin([channelName]);

  if (!userData) {
    return 0;
  }

  const channelsAddedAll: Channel[] = [];

  const addedChannel = config.addChannelLink(
    `https://www.twitch.tv/${channelName}`,
    false,
  );

  if (addedChannel) {
    channelsAddedAll.push(addedChannel);
  }

  const channelsToAdd = [];

  await Promise.all(
    userData.data.map(async ({ id }) => {
      let cursor: string = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const followedChannelsData = await twitchClient.getFollowedChannels(
          id,
          cursor,
        );

        if (!followedChannelsData) {
          break;
        }

        const followedChannels = followedChannelsData.data;

        cursor = followedChannelsData.pagination.cursor;

        if (followedChannels.length === 0) {
          break;
        }

        followedChannels.forEach((followedChannel) =>
          channelsToAdd.push(followedChannel),
        );
      }
    }),
  );

  const { channelsAdded } = await twitchImportChannels(channelsToAdd);

  channelsAdded.forEach((channelObj) => channelsAddedAll.push(channelObj));

  if (emitEvent) {
    config.emit('channel_added_channels', channelsAddedAll);
  }

  return channelsAddedAll.length;
}

async function twitchImport(channelName: string) {
  const res = await twitchImportBase(channelName, true);

  if (res !== null) {
    dialog.showMessageBox({
      type: 'info',
      message: `Import done ${res} channels added.`,
    });

    return true;
  } else {
    dialog.showMessageBox({
      type: 'error',
      message: 'Import error.',
    });

    return false;
  }
}

async function autoTwitchImport(emitEvent: boolean) {
  await Promise.all(
    _.map(config.settings.twitchImport, async (channelName) => {
      await twitchImportBase(channelName, emitEvent);
    }),
  );
}

export async function loop() {
  await autoTwitchImport(false);

  (async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(10 * 60 * 1000);

      await autoTwitchImport(true);
    }
  })();
}
