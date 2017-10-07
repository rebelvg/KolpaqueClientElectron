import {channelsStateType} from '../reducers/channels';

const {ipcRenderer} = window.require('electron');

export const GET_CHANNELS = 'GET_CHANNELS';
export const ADD_CHANNEL = 'ADD_CHANNEL';
export const DELETE_CHANNEL = 'DELETE_CHANNEL';
export const CHANGE_STATUS = 'CHANGE_STATUS';

export function initChannels() {
    let data = ipcRenderer.sendSync('getChannels');

    ipcRenderer.send('client_ready');

    return {
        type: GET_CHANNELS,
        data: data
    };
}

export function deleteChannel(id) {
    return {
        type: DELETE_CHANNEL,
        id
    }
}

export function addChannel(channel) {
    return {
        type: ADD_CHANNEL,
        channel
    }
}

export function changeStatus(id, settingName, settingValue) {
    return {
        type: CHANGE_STATUS,
        id,
        settingName,
        settingValue
    };
}
