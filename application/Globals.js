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

module.exports.allowedProtocols = allowedProtocols;
module.exports.registeredServices = registeredServices;
