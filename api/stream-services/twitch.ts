import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { Channel } from '../channel-class';
import { twitchClient, TWITCH_CHUNK_LIMIT } from '../api-clients';
import { BaseStreamService, ProtocolsEnum, ServiceNamesEnum } from './_base';

async function getTwitchStats(
  channelObjs: Channel[],
  printBalloon: boolean,
): Promise<void> {
  await twitchClient.refreshAccessToken();

  const chunkedChannels = _.chunk(channelObjs, TWITCH_CHUNK_LIMIT);

  await Promise.all(
    chunkedChannels.map(async (channelObjs) => {
      const channels = channelObjs.map((channelObj) => {
        return {
          channelObj,
          userId: null,
        };
      });

      const userData = await twitchClient.getUsersByLogin(
        channelObjs.map((channel) => channel.name),
      );

      if (!userData) {
        return;
      }

      _.forEach(channels, (channel) => {
        _.forEach(userData.data, (user) => {
          if (user.login === channel.channelObj.name) {
            channel.userId = user.id;
          }
        });
      });

      const existingChannels = channels.filter((channel) => !!channel.userId);

      if (existingChannels.length === 0) {
        _.forEach(channels, ({ channelObj }) => {
          channelObj.setOffline();
        });

        return;
      }

      const streamData = await twitchClient.getStreams(
        existingChannels.map(({ userId }) => userId),
      );

      if (!streamData) {
        return;
      }

      _.forEach(channels, ({ channelObj, userId }) => {
        if (_.find(streamData.data, { user_id: userId })) {
          channelObj.setOnline(printBalloon);
        } else {
          channelObj.setOffline();
        }
      });
    }),
  );
}

export class TwitchStreamService implements BaseStreamService {
  public name = ServiceNamesEnum.TWITCH;
  public protocols = [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP];
  public hosts = ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'];
  public paths = ['/'];
  public channelNamePath = 1;
  public embedLink = () => null;
  public chatLink = (channel: Channel): string => {
    return `https://www.twitch.tv/${channel.name}/chat`;
  };
  public icon = fs.readFileSync(
    path.normalize(path.join(__dirname, '../../icons', 'twitch.png')),
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
}
