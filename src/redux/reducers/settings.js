import {GET_SETTINGS, CHANGE_SETTINGS} from '../actions/settings'

const initialState = {
    list: [],
};

export default function (state = initialState, action = {}) {
    switch (action.type) {
        case GET_SETTINGS:
            return {
                ...state,
                list: action.data,
            };

        case CHANGE_SETTINGS:
            return {
                ...state,
            }
        default:
            return {
                ...state
            }
    }
}
// Selectors

export const getSettings = (state) => state.settings && state.settings.list




