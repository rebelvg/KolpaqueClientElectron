import {createActions, handleActions} from 'redux-actions';
import {createSelector} from 'reselect';
import {getSortType, getReversed} from './settings'
import SortChannels from '../Channel/Helpers/SortChannels'
import {FilterChannels} from '../Channel/Helpers/FilterChannels'

const {ipcRenderer} = window.require('electron');

const defaultState = {
    channels: [],
    update: false,
    filter: '',
    loading: true,
    loaded: false,
    activeTab: 'online'
};

//ACTIONS

export const {
    initClient,
    getChannels,
    addChannel,
    addChannelResponse,
    deleteChannel,
    sendInfo,
    changeSetting,
    getInfo,
    setFilter,
    setSort,
    changeTab
} = createActions({
    INIT_CLIENT: () => {
        return {};
    },
    GET_CHANNELS: () => {
        const channels = ipcRenderer.sendSync('getChannels');
        ipcRenderer.send('client_ready');
        return {channels};
    },

    ADD_CHANNEL: channel => {
        ipcRenderer.send('channel_add', channel);
        return {channel};
    },

    ADD_CHANNEL_RESPONSE: channel => ({channel}),

    DELETE_CHANNEL: id => ({id}),

    SEND_INFO: info => {
        ipcRenderer.send('client_getInfo', info);
        return {info};
    },

    CHANGE_SETTING: settings => ({settings}),
    GET_INFO: info => ({info}),
    SET_FILTER: filter => ({filter}),
    SET_SORT: sort => ({sort}),
    CHANGE_TAB: tab => ({tab})
});

//REDUCER

export const reducer = handleActions({
    INIT_CLIENT: (state, action) => ({
        ...state,
        loaded: true
    }),
    GET_CHANNELS: (state, action) => ({
        ...state,
        channels: action.payload.channels
    }),

    ADD_CHANNEL: (state, action) => ({...state}),

    ADD_CHANNEL_RESPONSE: (state, action) => ({
        ...state,
        channels: [...state.channels, action.payload.channel]
    }),

    DELETE_CHANNEL: (state, action) => ({
        ...state,
        channels: state.channels.filter(
            channel => channel.id !== action.payload.id
        )
    }),

    SEND_INFO: (state, action) => ({...state}),

    CHANGE_SETTING: (state, {payload: {settings}}) => ({
        ...state,
        channels: state.channels.map(channel => {
            return settings[channel.id]
                ? {
                    ...channel,
                    ...settings[channel.id]
                }
                : channel
        })
    }),

    GET_INFO: (state, action) => ({...state, update: action.payload.info}),

    SET_FILTER: (state, action) => {
        return ({...state, filter: action.payload.filter})
    },

    SET_SORT: (state, action) => {
        return {...state, sort: action.payload.sort}
    },

    CHANGE_TAB: (state, action) =>
        ({...state, activeTab: action.payload.tab})

}, defaultState);

//SELECTORS

const getChannelsList = (state) => state.channel.channels;

export const getFilter = (state) => state.channel.filter;
export const getActiveTab = (state) => state.channel.activeTab;
export const getUpdate = (state) => state.channel.update;
export const getLoading = (state) => state.channel.loading;
export const getLoaded = (state) => state.channel.loaded;

export const getOnlineCount = createSelector(
    [getChannelsList, getFilter],
    (channels, filter) => FilterChannels(channels, filter).filter(channel => channel.isLive).length
)

export const getOfflineCount = createSelector(
    [getChannelsList, getFilter],
    (channels, filter) => FilterChannels(channels, filter).filter(channel => !channel.isLive).length
)

export const getFullCount = createSelector(
    [getOnlineCount, getOfflineCount],
    (online, offline) => ({online, offline})
)

export const getCompleteChannels = createSelector(
    [getChannelsList, getSortType, getReversed, getFilter],
    (channels, sort, isReversed, filter) => {
        return SortChannels(FilterChannels(channels, filter), sort, isReversed)
    }
)
