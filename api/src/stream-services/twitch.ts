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
import { logger } from '../logs';
import { SourcesEnum } from '../enums';
import { app, nativeImage } from 'electron';

async function getStats(
  channels: Channel[],
  printBalloon: boolean,
): Promise<void> {
  const chunkedChannels = _.chunk(channels, TWITCH_CHUNK_LIMIT);

  const userIdMap: {
    [key: string]: string;
  } = {};
  const streamStatusMap: {
    [key: string]: boolean;
  } = {};

  await Promise.all(
    chunkedChannels.map(async (channels) => {
      const usersData = await twitchClient.getUsersByLogin(
        channels.map((channel) => channel.name),
        'getStats',
      );

      if (!usersData) {
        return;
      }

      const streamsData = await twitchClient.getStreams(
        usersData.data.map((u) => u.id),
      );

      if (!streamsData) {
        return;
      }

      for (const userData of usersData.data) {
        userIdMap[userData.login] = userData.id;
        streamStatusMap[userData.id] = false;
      }

      for (const streamData of streamsData.data) {
        streamStatusMap[streamData.user_id] = true;
      }
    }),
  );

  for (const channel of channels) {
    const userId = userIdMap[channel.name];

    if (!userId) {
      continue;
    }

    const streamStatus = streamStatusMap[userId];

    if (typeof streamStatus === 'undefined') {
      continue;
    }

    if (!streamStatus) {
      channel.setOffline();
    } else {
      channel.setOnline(printBalloon);
    }
  }
}

async function getInfo(allChannels: Channel[]): Promise<undefined> {
  const filteredChannels = _.filter(
    allChannels,
    (channel) => !channel._iconChecked,
  );

  if (filteredChannels.length === 0) {
    return;
  }

  const chunkedChannels = _.chunk(filteredChannels, TWITCH_CHUNK_LIMIT);

  for (const channels of chunkedChannels) {
    logger('info', 'channel_info_twitch_start', channels.length);

    const userData = await twitchClient.getUsersByLogin(
      channels.map((channel) => channel.name),
      'getInfo',
    );

    if (!userData) {
      continue;
    }

    logger(
      'info',
      'channel_info_twitch_user_data',
      channels.length,
      !!userData,
    );

    let _downloadedLogosCount = 0;

    for (const channel of channels) {
      for (const user of userData.data) {
        if (user.login !== channel.name) {
          continue;
        }

        const profileImageUrl = user.profile_image_url;

        if (!profileImageUrl) {
          continue;
        }

        _downloadedLogosCount++;

        const logoBuffer =
          await commonClient.getContentAsBuffer(profileImageUrl);

        channel._iconChecked = true;

        if (logoBuffer) {
          channel._trayIcon = nativeImage
            .createFromBuffer(logoBuffer)
            .resize({ height: 16 });
        }
      }
    }

    logger(
      'info',
      'channel_info_twitch_done',
      channels.length,
      _downloadedLogosCount,
    );
  }
}

export class TwitchStreamService extends BaseStreamService {
  public name = ServiceNamesEnum.TWITCH;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'];
  public paths = [/^\/(\S+)\/+/gi, /^\/(\S+)\/*/gi];
  public chatUrl(channel: Channel): string {
    return `${this.embedUrl(channel)}/chat`;
  }
  public icon = fs.readFileSync(
    path.normalize(path.join(app.getAppPath(), './api/icons', 'twitch.png')),
    {
      encoding: null,
    },
  );
  public play(channel: Channel) {
    return Promise.resolve({
      playUrl: channel._customPlayUrl || channel.url,
      params: ['--twitch-disable-hosting', '--twitch-disable-ads'],
    });
  }
  public async playLQ(channel: Channel) {
    const { playUrl, params } = await this.play(channel);

    return {
      playUrl,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  }
  public checkLiveTimeout = 30;
  public checkLiveConfirmation = 3;
  public getStats = getStats;
  public getInfo = getInfo;
  public doImport = async (channelNames: string[], emitEvent: boolean) => {
    if (!config.settings.enableTwitchImport) {
      return [];
    }

    const channels: Channel[] = [];
    const allImportedChannelNames: string[] = [];

    try {
      const res = await twitchClient.getUsers();

      if (!res) {
        return [];
      }

      await Promise.all(
        _.map(res.data, async (twitchChannel) => {
          const { channelsAddedAll, channelNames } = await this.importBase(
            twitchChannel.id,
            twitchChannel.login,
            emitEvent,
          );

          channels.push(...channelsAddedAll);

          allImportedChannelNames.push(...channelNames);
        }),
      );
    } catch (error) {
      logger('warn', error);

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
          logger('info', 'twitch_imported_channel_delete', channel.name);

          channelIdsToDelete.push(channel.id);
        }
      }
    }

    for (const channelId of channelIdsToDelete) {
      config.removeChannelById(channelId);
    }

    return channels;
  };
  public doImportSettings(emitEvent: boolean) {
    const channelNames = config.settings.twitchImport;

    return this.doImport(channelNames, emitEvent);
  }
  public buildUrl(channelName: string) {
    return `${this.protocols[0]}//${this.hosts[0]}/${channelName}`;
  }

  private async importBase(
    channelId: string,
    channelName: string,
    emitEvent: boolean,
  ) {
    const channelsAddedAll: Channel[] = [];

    const addedChannel = config.addChannelByUrl(
      this.buildUrl(channelName),
      SourcesEnum.MANUAL_ACTION,
    );

    if (addedChannel) {
      channelsAddedAll.push(addedChannel);
    }

    const channelsToAdd: ITwitchFollowedChannel[] = [];

    try {
      let cursor = '';

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
      logger('warn', error);
    }

    const { channelsAdded, channelNames } =
      await this.addImportedChannels(channelsToAdd);

    channelsAdded.forEach((channel) => channelsAddedAll.push(channel));

    if (emitEvent) {
      await config.runChannelUpdates(channelsAdded, emitEvent, 'importBase');
    }

    return { channelsAddedAll, channelNames };
  }

  private async addImportedChannels(channels: ITwitchFollowedChannel[]) {
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
            const channel = config.addChannelByUrl(
              `${this.buildUrl(importedChannel.broadcaster_login)}`,
              SourcesEnum.AUTO_IMPORT,
            );

            if (channel) {
              channelsAdded.push(channel);

              logger('info', 'twitch_imported_channel', channel.url);
            }
          }
        }),
      );
    } catch (error) {
      logger('warn', error);
    }

    return { channelsAdded, channelNames };
  }
}
