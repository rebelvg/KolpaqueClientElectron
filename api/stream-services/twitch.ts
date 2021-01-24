import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { commonClient, twitchClient, TWITCH_CHUNK_LIMIT } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getTwitchStats(
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

async function getTwitchInfoAsync(channels: Channel[]): Promise<void> {
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

export class TwitchStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.TWITCH;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'];
  public paths = ['/'];
  public channelNamePath = 1;
  public embedLink = (channel: Channel) => {
    return channel.link;
  };
  public chatLink = (channel: Channel): string => {
    return `https://www.twitch.tv/${channel.name}/chat`;
  };
  public icon = fs.readFileSync(
    path.normalize(path.join(process.cwd(), 'icons', 'twitch.png')),
    {
      encoding: null,
    },
  );
  public play = (channel: Channel) => {
    return {
      playLink: channel._customPlayUrl || channel.link,
      params: ['--twitch-disable-hosting', '--twitch-disable-ads'],
    };
  };
  public playLQ = (channel: Channel) => {
    const { playLink, params } = this.play(channel);

    return {
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    };
  };
  public checkLiveTimeout = 30;
  public checkLiveConfirmation = 3;
  public checkChannels = getTwitchStats;
  public getInfo = getTwitchInfoAsync;
}
