import {GET_CHANNELS, CHANGE_STATUS, DELETE_CHANNEL, ADD_CHANNEL} from '../Actions/ChannelActions'

const initialState = {
    channels: [],
};

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

        case ADD_CHANNEL:
            return {
                ...state,
                channels: [...state.channels, action.channel]
            };
        default:
            return state
    }
}

// Selectors

export const getChannels = (state) => state.channel && state.channel.channels

export const getOffline = (state) =>
state.channel && state.channel.channels.filter((channel) => !channel.isLive);

export const getOnline = (state) =>
state.channel && state.channel.channels.filter((channel) => channel.isLive);



