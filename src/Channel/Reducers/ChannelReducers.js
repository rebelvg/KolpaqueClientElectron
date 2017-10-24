import {
    GET_CHANNELS,
    SORT_CHANNELS,
    CHANGE_STATUS,
    DELETE_CHANNEL,
    ADD_CHANNEL,
    ADD_CHANNEL_RESPONSE,
    GET_INFO,
    SEND_INFO
} from '../Actions/ChannelActions'
import SortChannels from '../Helpers/SortChannels'
import FilterChannels from '../Helpers/FilterChannels'
import Immutable, {fromJS, List} from 'immutable';

const initialState = fromJS({
    channels: List([]),
    update: false,
    sort: 'lastAdded',
    reverse: false,
    filter: ''
});

export default function (state = initialState, action = {}) {
    switch (action.type) {

        case GET_CHANNELS: {
            return state.set('channels', List(action.data))
        }

        case CHANGE_STATUS: {
            const indexToUpdate = state.get('channels').findIndex(({id}) => id === action.id);
            console.log(state.getIn(['channels', indexToUpdate]))
            state.updateIn(['channels', indexToUpdate], (channel) => channel[action.settingName] = action.settingValue)
            return state;
        }

        case DELETE_CHANNEL: {
            state = state.updateIn(['channels'], (channels) => channels.filter(c => c.id !== action.id))
            return state
        }

        case ADD_CHANNEL_RESPONSE: {
            state = state.updateIn(['channels'], (channels) => channels.push(action.channel))
            return state
        }

        case ADD_CHANNEL: {
            return state;
        }

        case SEND_INFO: {
            return state;
        }

        case GET_INFO: {
            state.setIn(['update'], action.info)
        }

        default: {
            return state
        }
    }
}

// Selectors

export const getChannels = (state) => state.channel.get('channels').toJS();

export const getUpdateStatus = (state) => state.channel.get('update')
