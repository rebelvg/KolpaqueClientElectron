import * as fs from 'fs';
const path = require('path');

const allowedProtocols = ['rtmp:', 'http:', 'https:'];

const registeredServices = {
  'klpq-vps': {
    protocols: ['rtmp:'],
    hosts: ['vps.klpq.men', 'stream.klpq.men'],
    paths: ['/live/'],
    name: 2,
    embed: channelObj => {
      return `http://stream.klpq.men/${channelObj.name}`;
    },
    chat: channelObj => {
      return `http://stream.klpq.men/chat`;
    },
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '/..', 'icons', 'klpq_vps.png')), {
      encoding: null
    })
  },
  'klpq-main': {
    protocols: ['rtmp:'],
    hosts: ['main.klpq.men'],
    paths: ['/live/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '/..', 'icons', 'klpq_main.png')), {
      encoding: null
    })
  },
  twitch: {
    protocols: ['https:', 'http:'],
    hosts: ['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'],
    paths: ['/'],
    name: 1,
    embed: null,
    chat: channelObj => {
      return `https://www.twitch.tv/${channelObj.name}/chat`;
    },
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '/..', 'icons', 'twitch.png')), {
      encoding: null
    })
  },
  'youtube-user': {
    protocols: ['https:', 'http:'],
    hosts: ['www.youtube.com', 'youtube.com'],
    paths: ['/user/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '/..', 'icons', 'youtube.png')), {
      encoding: null
    })
  },
  'youtube-channel': {
    protocols: ['https:', 'http:'],
    hosts: ['www.youtube.com', 'youtube.com'],
    paths: ['/channel/'],
    name: 2,
    embed: null,
    chat: null,
    icon: fs.readFileSync(path.normalize(path.join(__dirname, '/..', 'icons', 'youtube.png')), {
      encoding: null
    })
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

const preInstalledChannels = ['rtmp://vps.klpq.men/live/main', 'rtmp://main.klpq.men/live/main'];

let twitchApiKey = 'dk330061dv4t81s21utnhhdona0a91x';

exports.allowedProtocols = allowedProtocols;
exports.registeredServices = registeredServices;
exports.preInstalledChannels = preInstalledChannels;
exports.twitchApiKey = twitchApiKey;
