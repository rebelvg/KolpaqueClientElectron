import {
    SET_FILTER
} from '../Actions/SearchActions'

const initialState = {
    filter: ''
}

export default function (state = initialState, action = {}) {
    switch (action.type) {
        case SET_FILTER: {
            return {
                ...state,
                filter: action.filter
            }
        }

        default: {
            return state
        }
    }
}

// Selectors

export const getFilter = (state) => state.search.filter;
