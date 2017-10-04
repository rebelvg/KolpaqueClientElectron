const {URL} = require('url');
const _ = require('lodash');

const {allowedProtocols, registeredServices} = require('./Globals');

class Channel {
    constructor(channelLink) {
        channelLink = channelLink.trim();

        this.service = 'custom';
        this.name = null;
        this.link = channelLink;
        this.protocol = null;
        this.isLive = false;

        this.visibleName = null;
        this.isPinned = false;
        this.autoStart = false;
        this.autoRestart = false;

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
                            this.visibleName = this.name;

                            channelURL.protocol = serviceObj.protocols[0];
                            channelURL.host = serviceObj.hosts[0];
                            channelURL.path = serviceObj.paths[0] + nameArray[serviceObj.name];

                            this.link = channelURL.href;
                        }
                    });
                }
            }
        });

        if (this.service === 'custom') {
            this.visibleName = this.link;
        }
    }
}

module.exports = Channel;
