import {GET_CHANNELS, CHANGE_STATUS, DELETE_CHANNEL, ADD_CHANNEL} from '../actions/channels'


const initialState = {
	online: [],
	offline: [],
	channels: [],
};

export default function (state = initialState, action = {}) {
	switch (action.type) {
		case GET_CHANNELS:
			return {
				...state,
				channels: action.data,
				offline: action.data
			};
		case CHANGE_STATUS:
			const channels = [...state.channels.filter((channel) => channel.link !== action.channel.link), action.channel];
			console.log(channels);
			const offline = channels.filter((channel) => !channel.isLive)
			const online = channels.filter((channel) => channel.isLive)
			return {
				...state,
				channels, online, offline
			}
		case DELETE_CHANNEL:
			return {
				...state,
				offline: state.offline.filter(item => action.data !== item.link),
				online: state.online.filter(item => action.data !== item.link)
			}
		case ADD_CHANNEL:
			return {
				...state,
				offline: [...state.offline, {link: action.data, name: action.data}]
			};
		default:
			return state
	}
}
// Selectors
export const getOffline = (state) =>
state.channel && state.channel.offline;

export const getOnline = (state) =>
state.channel && state.channel.online;



