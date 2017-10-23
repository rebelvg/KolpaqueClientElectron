import {channelsStateType} from '../Reducers/ChannelReducers';
import {reset} from 'redux-form';
const {ipcRenderer} = window.require('electron');

export const GET_CHANNELS = 'GET_CHANNELS';
export const ADD_CHANNEL = 'ADD_CHANNEL';
export const SORT_CHANNELS = 'SORT_CHANNELS';
export const GET_INFO = 'GET_INFO';
export const SEND_INFO = 'SEND_INFO'
export const ADD_CHANNEL_RESPONSE = 'ADD_CHANNEL_RESPONSE';
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

export function sortChannels () {
    return {
        type: SORT_CHANNELS,
    }
}

export function deleteChannel(id) {
    return {
        type: DELETE_CHANNEL,
        id
    }
}

export function sendInfo(info) {
    ipcRenderer.send('client_getInfo', info);
    return {
        type: SEND_INFO
    }
}
export function getInfo(info) {
    return {
        type: GET_INFO,
        info: info
    }
}

export function addChannel(channel) {
    ipcRenderer.send('channel_add', channel);
    return {
        type: ADD_CHANNEL,
        channel
    }

}
export function addChannelResponse(channel) {
    return {
        type: ADD_CHANNEL_RESPONSE,
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
