import {createActions, handleActions} from 'redux-actions';
import {createSelector} from 'reselect';
import SortChannels from '../Channel/Helpers/SortChannels'
import {FilterChannels} from '../Channel/Helpers/FilterChannels'

const {ipcRenderer} = window.require('electron');

const defaultState = {
    channels: [],
    update: false,
    sort: 'lastUpdated',
    reverse: false,
    filter: '',
    loading: true,
    loaded: false
};

//ACTIONS

export const {
    getChannels,
    addChannel,
    addChannelResponse,
    deleteChannel,
    sendInfo,
    changeSetting,
    getInfo,
    setFilter,
    setSort
} = createActions({
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

    CHANGE_SETTING: (id, name, value) => ({
        id,
        name,
        value
    }),
    GET_INFO: info => ({info}),
    SET_FILTER: filter => ({filter}),
    SET_SORT: sort => ({sort})
});

//REDUCER

export const reducer = handleActions(
    {
        GET_CHANNELS: (state, action) => ({
            ...state,
            loaded: true,
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

        CHANGE_SETTING: (state,
                         {payload: {id, name, value}}) => ({
            ...state,
            channels: state.channels.map(
                channel =>
                    channel.id === id
                        ? {...channel, [name]: value}
                        : channel
            )
        }),

        GET_INFO: (state, action) => ({...state, update: action.payload.info}),

        SET_FILTER: (state, action) => ({...state, filter: action.payload.filter}),

        SET_SORT: (state, action) => {
            console.log(action.payload)
            return {...state, sort: action.payload.sort}
        }
    },
    defaultState
);

//SELECTORS

const getChannelsList = (state) => state.channel.channels;
const getSortMode = (state) => state.channel.sort;
const getFilter = (state) => state.channel.filter;

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
    [getChannelsList, getSortMode, getFilter],
    (channels, sort, filter) => SortChannels(FilterChannels(channels, filter), sort)
)
