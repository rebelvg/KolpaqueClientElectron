import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import {
  commonClient,
  ITwitchFollowedChannel,
  twitchClient,
  TWITCH_CHUNK_LIMIT,
} from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';
import { config } from '../settings-file';
import { addLogs } from '../logs';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await twitchClient.refreshAccessToken();

  const chunkedChannels = _.chunk(channels, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async (channels) => {
      const mappedChannels = channels.map((channel) => {
        return {
          channel,
          userId: null,
        };
      });

      const userData = await twitchClient.getUsersByLogin(
        channels.map((channel) => channel.name),
      );

      if (!userData) {
        return;
      }

      _.forEach(mappedChannels, (channel) => {
        _.forEach(userData.data, (user) => {
          if (user.login === channel.channel.name) {
            channel.userId = user.id;
          }
        });
      });

      const existingChannels = mappedChannels.filter(
        (channel) => !!channel.userId,
      );

      if (existingChannels.length === 0) {
        _.forEach(mappedChannels, ({ channel }) => {
          channel.setOffline();
        });

        return;
      }

      const streamData = await twitchClient.getStreams(
        existingChannels.map(({ userId }) => userId),
      );

      if (!streamData) {
        return;
      }

      _.forEach(mappedChannels, ({ channel, userId }) => {
        if (_.find(streamData.data, { user_id: userId })) {
          channel.setOnline(printBalloon);
        } else {
          channel.setOffline();
        }
      });
    }),
  );
}

async function getInfo(channels: Channel[]): Promise<void> {
  await twitchClient.refreshAccessToken();

  const filteredChannels = _.filter(channels, (channel) => !channel._icon);

  if (filteredChannels.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(filteredChannels, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async (channels) => {
      const userData = await twitchClient.getUsersByLogin(
        channels.map((channel) => channel.name),
      );

      await Promise.all(
        channels.map(async (channel) => {
          await Promise.all(
            _.map(userData?.data, async (user) => {
              if (user.login !== channel.name) {
                return;
              }

              const profileImageUrl = user?.profile_image_url;

              if (!profileImageUrl) {
                return;
              }

              const logoBuffer = await commonClient.getContentAsBuffer(
                profileImageUrl,
              );

              if (logoBuffer) {
                channel._icon = logoBuffer;
              }
            }),
          );
        }),
      );
    }),
  );
}

async function addImportedChannels(
  channels: ITwitchFollowedChannel[],
): Promise<Channel[]> {
  const channelsAdded: Channel[] = [];

  const chunkedChannels = _.chunk(channels, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async (channels) => {
      const userData = await twitchClient.getUsersById(
        channels.map((channel) => channel.to_id),
      );

      if (!userData) {
        return;
      }

      for (const importedChannel of userData.data) {
        const channel = await config.addChannelLink(
          `${twitchStreamService.buildChannelLink(importedChannel.login)}`,
          false,
        );

        if (channel) {
          channelsAdded.push(channel);

          addLogs('twitch_imported_channel', channel.link);
        }
      }
    }),
  );

  return channelsAdded;
}

async function importBase(
  channelName: string,
  emitEvent: boolean,
): Promise<Channel[]> {
  await twitchClient.refreshAccessToken();

  if (!channelName) {
    return [];
  }

  channelName = channelName.trim();

  const userData = await twitchClient.getUsersByLogin([channelName]);

  if (!userData) {
    return [];
  }

  const channelsAddedAll: Channel[] = [];

  const addedChannel = await config.addChannelLink(
    twitchStreamService.buildChannelLink(channelName),
    false,
  );

  if (addedChannel) {
    channelsAddedAll.push(addedChannel);
  }

  const channelsToAdd = [];

  await Promise.all(
    userData.data.map(async ({ id }) => {
      let cursor = '';

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

        if (!cursor) {
          break;
        }
      }
    }),
  );

  const channelsAdded = await addImportedChannels(channelsToAdd);

  channelsAdded.forEach((channel) => channelsAddedAll.push(channel));

  if (emitEvent) {
    await config.addChannels(channelsAdded);
  }

  return channelsAddedAll;
}

async function doImport(
  channelNames: string[],
  emitEvent: boolean,
): Promise<Channel[]> {
  const channels: Channel[] = [];

  await Promise.all(
    _.map(channelNames, async (channelName) => {
      const importedChannels = await importBase(channelName, emitEvent);

      channels.push(...importedChannels);
    }),
  );

  return channels;
}

class TwitchStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.TWITCH;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'];
  public paths = [/^\/(\S+)\/+/gi, /^\/(\S+)\/*/gi];
  public chatLink(channel: Channel): string {
    return `${this.embedLink(channel)}/chat`;
  }
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'twitch.png')),
    {
      encoding: null,
    },
  );
  public play(channel: Channel) {
    return {
      playLink: channel._customPlayUrl || channel.link,
      params: ['--twitch-disable-hosting', '--twitch-disable-ads'],
    };
  }
  public playLQ(channel: Channel) {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  }
  public checkLiveTimeout = 30;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public getInfo = getInfo;
  public doImport = doImport;
  public doImportSettings(emitEvent: boolean) {
    const channelNames = config.settings.twitchImport;

    return this.doImport(channelNames, emitEvent);
  }
  public buildChannelLink(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }
}

export const twitchStreamService = new TwitchStreamService();
