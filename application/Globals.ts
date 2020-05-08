import * as fs from 'fs';
import * as path from 'path';

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  HTTP = 'http:',
  HTTPS = 'https:'
}

export const allowedProtocols = [...Object.values(ProtocolsEnum)];

export const registeredServices = {
  'klpq-vps': {
    protocols: [ProtocolsEnum.RTMP],
    hosts: ['vps.klpq.men', 'stream.klpq.men'],
    paths: ['/live/'],
    name: 2,
    embed: channelObj => {
      return `http://stream.klpq.men/${channelObj.name}`;
    },
    chat: channelObj => {
      return `http://stream.klpq.men/chat`;
    },
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '../icons', 'klpq_vps.png')), {
      encoding: null
    }),
    onLQ: (playLink: string, params: string[]) => {
      return {
        playLink: playLink.replace('/live/', '/restream/'),
        params
      };
    }
  },
  twitch: {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'],
    paths: ['/'],
    name: 1,
    embed: null,
    chat: channelObj => {
      return `https://www.twitch.tv/${channelObj.name}/chat`;
    },
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '../icons', 'twitch.png')), {
      encoding: null
    })
  },
  'youtube-user': {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.youtube.com', 'youtube.com'],
    paths: ['/user/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '../icons', 'youtube.png')), {
      encoding: null
    })
  },
  'youtube-channel': {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.youtube.com', 'youtube.com'],
    paths: ['/channel/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '../icons', 'youtube.png')), {
      encoding: null
    })
  },
  chaturbate: {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.chaturbate.com', 'chaturbate.com'],
    paths: ['/'],
    name: 1,
    embed: null,
    chat: null,
    icon: null
  },
  custom: {
    protocols: [],
    hosts: [],
    paths: [],
    name: 0,
    embed: null,
    chat: null,
    icon: null
  }
};

export const preInstalledChannels = [];

export const twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';

export const klpqServiceUrl = 'https://client-api.klpq.men';
