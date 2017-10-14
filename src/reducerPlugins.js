import {ADD_CHANNEL} from './Channel/Actions/ChannelActions'

export const addChannel = {
    addChannel: (state, action) => {
        switch (action.type) {
            case ADD_CHANNEL:
                return undefined;       // <--- blow away form data
            default:
                return state;
        }
    }
}