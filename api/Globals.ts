import * as fs from 'fs';
import * as path from 'path';
import { Channel } from './ChannelClass';

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  HTTP = 'http:',
  HTTPS = 'https:',
}

export interface IStreamService {
  protocols: ProtocolsEnum[];
  hosts: string[];
  paths: string[];
  name: number;
  embed: (channelObj: Channel) => string;
  chat: (channelObj: Channel) => string;
  icon: Buffer;
  onLQ: (
    playLink: string,
    params: string[],
  ) => { playLink: string; params: string[] };
}

export const allowedProtocols = [...Object.values(ProtocolsEnum)];

export const registeredServices: {
  [serviceName: string]: IStreamService;
} = {
  'klpq-vps': {
    protocols: [ProtocolsEnum.RTMP],
    hosts: ['vps.klpq.men', 'stream.klpq.men'],
    paths: ['/live/'],
    name: 2,
    embed: (channelObj: Channel) => {
      return `http://stream.klpq.men/${channelObj.name}`;
    },
    chat: channelObj => {
      return `http://stream.klpq.men/chat`;
    },
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'klpq_vps.png')),
      {
        encoding: null,
      },
    ),
    onLQ: (playLink: string, params: string[]) => {
      return {
        playLink: playLink.replace('/live/', '/encode/'),
        params,
      };
    },
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
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'twitch.png')),
      {
        encoding: null,
      },
    ),
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
  'youtube-user': {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.youtube.com', 'youtube.com'],
    paths: ['/user/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'youtube.png')),
      {
        encoding: null,
      },
    ),
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
  'youtube-channel': {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.youtube.com', 'youtube.com'],
    paths: ['/channel/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'youtube.png')),
      {
        encoding: null,
      },
    ),
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
  chaturbate: {
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.chaturbate.com', 'chaturbate.com'],
    paths: ['/'],
    name: 1,
    embed: null,
    chat: null,
    icon: null,
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
  custom: {
    protocols: [],
    hosts: [],
    paths: [],
    name: 0,
    embed: null,
    chat: null,
    icon: null,
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
};

export const klpqServiceUrl = 'https://client-api.klpq.men';
