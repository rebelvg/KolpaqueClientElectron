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
import { SourcesEnum } from '../enums';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
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
        'getStats',
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

async function getInfo(allChannels: Channel[]): Promise<void> {
  const filteredChannels = _.filter(allChannels, (channel) => !channel._icon);

  if (filteredChannels.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(filteredChannels, TWITCH_CHUNK_LIMIT);

  for (const channels of chunkedChannels) {
    addLogs('info', 'channel_info_twitch_start', channels.length);

    const userData = await twitchClient.getUsersByLogin(
      channels.map((channel) => channel.name),
      'getInfo',
    );

    addLogs(
      'info',
      'channel_info_twitch_user_data',
      channels.length,
      !!userData,
    );

    let _downloadedLogosCount = 0;

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

            _downloadedLogosCount++;

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

    addLogs(
      'info',
      'channel_info_twitch_done',
      channels.length,
      _downloadedLogosCount,
    );
  }
}

async function addImportedChannels(
  channels: ITwitchFollowedChannel[],
): Promise<[Channel[], string[]]> {
  const channelsAdded: Channel[] = [];

  const channelNames: string[] = [];

  try {
    await Promise.all(
      channels.map((importedChannel) => {
        channelNames.push(importedChannel.broadcaster_login);

        const foundChannel = config.findByQuery({
          serviceName: ServiceNamesEnum.TWITCH,
          name: importedChannel.broadcaster_login,
        });

        if (foundChannel) {
          if (!foundChannel.sources.includes(SourcesEnum.AUTO_IMPORT)) {
            foundChannel.sources.push(SourcesEnum.AUTO_IMPORT);
          }
        } else {
          const channel = config.addChannelLink(
            `${twitchStreamService.buildChannelLink(
              importedChannel.broadcaster_login,
            )}`,
            SourcesEnum.AUTO_IMPORT,
          );

          if (channel) {
            channelsAdded.push(channel);

            addLogs('info', 'twitch_imported_channel', channel.link);
          }
        }
      }),
    );
  } catch (error) {
    addLogs('info', 'error', error);

    return null;
  }

  return [channelsAdded, channelNames];
}

async function importBase(
  channelId: string,
  channelName: string,
  emitEvent: boolean,
): Promise<[Channel[], string[]]> {
  const channelsAddedAll: Channel[] = [];

  const addedChannel = config.addChannelLink(
    twitchStreamService.buildChannelLink(channelName),
    SourcesEnum.MANUAL_ACTION,
  );

  if (addedChannel) {
    channelsAddedAll.push(addedChannel);
  }

  const channelsToAdd: ITwitchFollowedChannel[] = [];

  try {
    let cursor = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const followedChannelsData = await twitchClient.getFollowedChannels(
        channelId,
        cursor,
      );

      if (!followedChannelsData) {
        throw new Error('no_channels_data');
      }

      const { data: followedChannels } = followedChannelsData;

      if (followedChannels.length === 0) {
        break;
      }

      followedChannels.forEach((followedChannel) =>
        channelsToAdd.push(followedChannel),
      );

      cursor = followedChannelsData.pagination.cursor;

      if (!cursor) {
        break;
      }
    }
  } catch (error) {
    addLogs('info', 'error', error);

    return null;
  }

  const addImportedChannelsRes = await addImportedChannels(channelsToAdd);

  if (!addImportedChannelsRes) {
    return null;
  }

  const [channelsAdded, channelNames] = addImportedChannelsRes;

  channelsAdded.forEach((channel) => channelsAddedAll.push(channel));

  if (emitEvent) {
    await config.runChannelUpdates(channelsAdded, emitEvent);
  }

  return [channelsAddedAll, channelNames];
}

async function doImport(
  channelNames: string[],
  emitEvent: boolean,
): Promise<Channel[]> {
  if (!config.settings.enableTwitchImport) {
    return [];
  }

  const channels: Channel[] = [];
  const allImportedChannelNames: string[] = [];

  try {
    const { data } = await twitchClient.getUsers();

    await Promise.all(
      _.map(data, async (twitchChannel) => {
        const importBaseRes = await importBase(
          twitchChannel.id,
          twitchChannel.login,
          emitEvent,
        );

        if (!importBaseRes) {
          throw new Error('no_import_base');
        }

        const [importedChannels, channelNames] = importBaseRes;

        channels.push(...importedChannels);
        allImportedChannelNames.push(...channelNames);
      }),
    );
  } catch (error) {
    addLogs('info', 'error', error);

    return [];
  }

  const channelIdsToDelete: string[] = [];

  for (const channel of config.channels) {
    if (
      channel.serviceName === ServiceNamesEnum.TWITCH &&
      channel.sources.includes(SourcesEnum.AUTO_IMPORT) &&
      !allImportedChannelNames.includes(channel.name)
    ) {
      _.pull(channel.sources, SourcesEnum.AUTO_IMPORT);

      if (channel.sources.length === 0) {
        addLogs('info', 'twitch_imported_channel_delete', channel.name);

        channelIdsToDelete.push(channel.id);
      }
    }
  }

  for (const channelId of channelIdsToDelete) {
    config.removeChannelById(channelId);
  }

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
    return Promise.resolve({
      playLink: channel._customPlayUrl || channel.link,
      params: ['--twitch-disable-hosting', '--twitch-disable-ads'],
    });
  }
  public async playLQ(channel: Channel) {
    const { playLink, params } = await this.play(channel);

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
