const {app, ipcMain, dialog, shell, nativeImage} = require('electron');
const _ = require('lodash');
const request = require('request');
const axios = require('axios');

const config = require('./SettingsFile');
const {twitchApiKey} = require('./Globals');

const services = {
    'twitch': getTwitchInfoAsync
};

async function getTwitchInfoAsync(channelObj) {
    if (channelObj._icon) return;

    let url = `https://api.twitch.tv/kraken/channels/${channelObj.name}`;

    try {
        const res = await axios.get(url, {
            headers: {'Client-ID': twitchApiKey}
        });

        if (res.status !== 200) return;
        if (!res.data.logo) return;

        const logoRes = await axios.get(res.data.logo, {
            responseType: 'arraybuffer'
        });

        if (logoRes.status !== 200) return;

        channelObj.changeSetting('_icon', logoRes.data, false);
    }
    catch (e) {
    }
}

async function getInfoAsync(channelObj) {
    if (services.hasOwnProperty(channelObj.service)) {
        await services[channelObj.service](channelObj);
    }
}

module.exports.getInfoAsync = getInfoAsync;
