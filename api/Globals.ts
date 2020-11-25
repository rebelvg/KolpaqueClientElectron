/* eslint-disable no-unused-vars */
import * as fs from 'fs';
import * as path from 'path';

import { Channel } from './channel-class';

export const TWITCH_CLIENT_ID = 'dk330061dv4t81s21utnhhdona0a91x';

export enum ProtocolsEnum {
  RTMP = 'rtmp:',
  HTTP = 'http:',
  HTTPS = 'https:',
}

export enum ServiceNamesEnum {
  KLPQ_VPS_RTMP = 'klpq-vps-rtmp',
  KLPQ_VPS_HTTP = 'klpq-vps-http',
  TWITCH = 'twitch',
  YOUTUBE_USER = 'youtube-user',
  YOUTUBE_CHANNEL = 'youtube_channel',
  CHATURBATE = 'chaturbate',
  CUSTOM = 'custom',
}

export interface IStreamService {
  serviceName: ServiceNamesEnum;
  protocols: ProtocolsEnum[];
  hosts: string[];
  paths: string[];
  name: number;
  embed: (channelObj: Channel) => string;
  chat: (channelObj: Channel) => string;
  icon: Buffer;
  playUrl: (channelObj: Channel) => { playLink: string; params: string[] };
  onLQ: (
    playLink: string,
    params: string[],
  ) => { playLink: string; params: string[] };
}

export const ALLOWED_PROTOCOLS = [...Object.values(ProtocolsEnum)];

export const REGISTERED_SERVICES: IStreamService[] = [
  {
    serviceName: ServiceNamesEnum.KLPQ_VPS_RTMP,
    protocols: [ProtocolsEnum.RTMP],
    hosts: ['mediaserver.klpq.men', 'stream.klpq.men', 'vps.klpq.men'],
    paths: ['/live/'],
    name: 2,
    embed: (channelObj: Channel) => {
      return `http://klpq.men/stream/${channelObj.name}`;
    },
    chat: null,
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'klpq_vps.png')),
      {
        encoding: null,
      },
    ),
    playUrl: (channelObj: Channel) => {
      return {
        playLink: `rtmp://mediaserver.klpq.men/live/${channelObj.name}`,
        params: [],
      };
    },
    onLQ: (playLink: string, params: string[]) => {
      return {
        playLink: playLink.replace('/live/', '/encode/'),
        params,
      };
    },
  },
  {
    serviceName: ServiceNamesEnum.KLPQ_VPS_HTTP,
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['klpq.men'],
    paths: ['/stream/'],
    name: 2,
    embed: (channelObj: Channel) => {
      return `http://klpq.men/stream/${channelObj.name}`;
    },
    chat: null,
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'klpq_vps.png')),
      {
        encoding: null,
      },
    ),
    playUrl: (channelObj: Channel) => {
      return {
        playLink: `https://encode.klpq.men/mpd/${channelObj.name}/index.mpd`,
        params: [],
      };
    },
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
  {
    serviceName: ServiceNamesEnum.TWITCH,
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'],
    paths: ['/'],
    name: 1,
    embed: null,
    chat: (channelObj) => {
      return `https://www.twitch.tv/${channelObj.name}/chat`;
    },
    icon: fs.readFileSync(
      path.normalize(path.join(__dirname, '../icons', 'twitch.png')),
      {
        encoding: null,
      },
    ),
    playUrl: (channelObj: Channel) => {
      return {
        playLink: channelObj._customPlayUrl || channelObj.link,
        params: ['--twitch-disable-hosting', '--twitch-disable-ads'],
      };
    },
    onLQ: (playLink, params) => ({
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    }),
  },
  {
    serviceName: ServiceNamesEnum.YOUTUBE_USER,
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
    playUrl: (channelObj: Channel) => {
      return {
        playLink: channelObj._customPlayUrl || channelObj.link,
        params: [],
      };
    },
    onLQ: (playLink, params) => ({
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    }),
  },
  {
    serviceName: ServiceNamesEnum.YOUTUBE_CHANNEL,
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
    playUrl: (channelObj: Channel) => {
      return {
        playLink: channelObj._customPlayUrl || channelObj.link,
        params: [],
      };
    },
    onLQ: (playLink, params) => ({
      playLink,
      params: params.concat(['--stream-sorting-excludes', '>=720p,>=high']),
    }),
  },
  {
    serviceName: ServiceNamesEnum.CHATURBATE,
    protocols: [ProtocolsEnum.HTTPS, ProtocolsEnum.HTTP],
    hosts: ['www.chaturbate.com', 'chaturbate.com'],
    paths: ['/'],
    name: 1,
    embed: null,
    chat: null,
    icon: null,
    playUrl: (channelObj: Channel) => {
      return {
        playLink: channelObj._customPlayUrl || channelObj.link,
        params: [],
      };
    },
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
  {
    serviceName: ServiceNamesEnum.CUSTOM,
    protocols: [],
    hosts: [],
    paths: [],
    name: 0,
    embed: null,
    chat: null,
    icon: null,
    playUrl: (channelObj: Channel) => {
      return {
        playLink: channelObj._customPlayUrl || channelObj.link,
        params: [],
      };
    },
    onLQ: (playLink, params) => ({
      playLink,
      params,
    }),
  },
];

export const klpqServiceUrl = 'https://client-api.klpq.men';
