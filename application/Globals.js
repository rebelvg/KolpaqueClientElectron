const allowedProtocols = ['rtmp:', 'http:', 'https:'];

const registeredServices = {
    'klpq-vps': {
        protocols: ['rtmp:'],
        hosts: ['vps.klpq.men', 'stream.klpq.men'],
        paths: ['/live/'],
        name: 2
    },
    'klpq-main': {
        protocols: ['rtmp:'],
        hosts: ['main.klpq.men'],
        paths: ['/live/'],
        name: 2
    },
    'twitch': {
        protocols: ['https:', 'http:'],
        hosts: ['www.twitch.tv', 'twitch.tv'],
        paths: ['/'],
        name: 1
    },
    'youtube-user': {
        protocols: ['https:', 'http:'],
        hosts: ['www.youtube.com', 'youtube.com'],
        paths: ['/user/'],
        name: 2
    },
    'youtube-channel': {
        protocols: ['https:', 'http:'],
        hosts: ['www.youtube.com', 'youtube.com'],
        paths: ['/channel/'],
        name: 2
    },
    'custom': {
        protocols: [],
        hosts: [],
        paths: [],
        name: 0
    }
};

const preInstalledChannels = ['rtmp://vps.klpq.men/live/main', 'rtmp://main.klpq.men/live/main'];

function buildChannelObj(channelLink) {
    try {
        const Channel = require('./ChannelClass');

        return new Channel(channelLink);
    }
    catch (e) {
        console.log(e.stack);

        return false;
    }
}

module.exports.allowedProtocols = allowedProtocols;
module.exports.registeredServices = registeredServices;
module.exports.preInstalledChannels = preInstalledChannels;
module.exports.buildChannelObj = buildChannelObj;
