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

export function deleteChannel(channel) {
    return {
        type: DELETE_CHANNEL,
        data: channel
    }
}

export function addChannel(channel) {
    return {
        type: ADD_CHANNEL,
        data: channel
    }
}

export function changeStatus(channel) {
    return {
        type: CHANGE_STATUS,
        data: channel
    };
}
