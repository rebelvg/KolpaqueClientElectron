import {
    GET_CHANNELS,
    CHANGE_STATUS,
    DELETE_CHANNEL,
    ADD_CHANNEL,
    ADD_CHANNEL_RESPONSE,
    GET_INFO,
    SEND_INFO
} from '../Actions/ChannelActions'

const initialState = {
    channels: [],
    update: false,
    sort: 'last'
};

const sortChannels = (channels, sort) => {
    return channels;
}

export default function (state = initialState, action = {}) {
    switch (action.type) {
        case GET_CHANNELS:
            return {
                ...state,
                channels: action.data,
            };

        case CHANGE_STATUS:
            let channel = state.channels.find(({id}) => id === action.id);
            console.log(channel);
            if (channel) {
                channel[action.settingName] = action.settingValue;
            }
            console.log(channel);

            return {
                ...state,
            }

        case DELETE_CHANNEL:
            return {
                ...state,
                channels: state.channels.filter(item => action.id !== item.id),
            }
        case ADD_CHANNEL_RESPONSE: {
            return {
                ...state,
                channels: [...state.channels, action.channel]
            };
        }
        case ADD_CHANNEL:
            return state

        case SEND_INFO:
            return state

        case GET_INFO:
            return {
                ...state,
                update: action.info
            }
        default:
            return state
    }
}

// Selectors

export const getChannels = (state) => state.channel && sortChannels(state.channel.channels, state.channel.sort)

export const getOffline = (state) =>
state.channel && sortChannels(state.channel.channels, state.channel.sort).filter((channel) => !channel.isLive);

export const getOnline = (state) =>
state.channel && sortChannels(state.channel.channels, state.channel.sort).filter((channel) => channel.isLive);

export const getUpdateStatus = (state) => state.channel && state.channel.update
