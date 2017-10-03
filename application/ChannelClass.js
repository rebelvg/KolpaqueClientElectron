const {URL} = require('url');
const _ = require('lodash');

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

class Channel {
    constructor(channelLink) {
        this.service = '';
        this.name = null;
        this.link = '';
        this.protocol = null;
        this.isLive = false;
        this.isPinned = false;

        let channelURL = new URL(channelLink);

        if (!allowedProtocols.includes(channelURL.protocol)) {
            throw Error(`Only [${allowedProtocols}] are allowed.`);
        }

        this.protocol = channelURL.protocol;

        if (channelURL.host.length < 1) {
            throw Error(`Hostname can't be empty.`);
        }

        if (channelURL.pathname.length < 2) {
            throw Error(`Pathname can't be empty.`);
        }

        _.forEach(registeredServices, (serviceObj, serviceName) => {
            if (serviceObj.protocols.includes(channelURL.protocol.toLowerCase()) && serviceObj.hosts.includes(channelURL.host.toLowerCase())) {
                let nameArray = _.split(channelURL.pathname, '/');

                if (nameArray[serviceObj.name]) {
                    _.forEach(serviceObj.paths, (path) => {
                        if (channelURL.pathname.toLowerCase().indexOf(path) === 0) {
                            this.service = serviceName;
                            this.name = nameArray[serviceObj.name];

                            channelURL.protocol = serviceObj.protocols[0];
                            channelURL.host = serviceObj.hosts[0];
                            channelURL.path = serviceObj.paths[0] + nameArray[serviceObj.name];

                            this.link = channelURL.href;
                        }
                    });
                }
            }
        });
    }
}

module.exports.allowedProtocols = allowedProtocols;
module.exports.registeredServices = registeredServices;
module.exports.Channel = Channel;
