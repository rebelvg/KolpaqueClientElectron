import {channelsStateType} from '../reducers/channels';
const {ipcRenderer} = window.require('electron');


export const GET_CHANNELS = 'GET_CHANNELS';
export const GET_CHANNELS_SUCCESS = 'GET_CHANNELS_SUCCESS';
export const CHANGE_STATUS = 'CHANGE_STATUS';

export function initChannels() {
    console.log(ipcRenderer)
    let data = ipcRenderer.sendSync('getChannels');
    let tmp = Object.keys(data).map((k) => data[k])
    data = tmp;
    console.log(data);
    ipcRenderer.send('client-ready');
    return {
        type: GET_CHANNELS,
        data: data
    };
}

export function changeStatus(channel) {
    return {
        type: CHANGE_STATUS,
        data: channel
    };
}




