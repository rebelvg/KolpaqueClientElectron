import {GET_CHANNELS, CHANGE_STATUS, DELETE_CHANNEL} from '../actions/channels'


const initialState = {
	online: [],
	offline: []
};

export default function (state = initialState, action = {}) {
	switch (action.type) {
		case GET_CHANNELS:
			return {
				...state,
				offline: action.data
			};
		case CHANGE_STATUS:
			return {
				...state,
				offline: state.offline.filter(item => action.data !== item.link),
				online: [...state.online, state.offline.find(item => action.data === item.link)]
			}
		case DELETE_CHANNEL:
			return {
				...state,
				offline: state.offline.filter(item => action.data !== item.link),
				online: state.online.filter(item => action.data !== item.link)
			}
		default:
			return state
	}
}
// Selectors
export const getOffline = (state) =>
state.channel && state.channel.offline;

export const getOnline = (state) =>
state.channel && state.channel.online;



