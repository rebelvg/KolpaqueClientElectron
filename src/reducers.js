import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form'
import channel from './Channel/Reducers/ChannelReducers';
import search from './Channel/Reducers/SearchReducer';
import settings from './Settings/Reducers/SettingsReducer';
import {addChannel} from './reducerPlugins';

const reducers = combineReducers({
    channel,
    settings,
    search,
    form: formReducer.plugin({
        ...addChannel
    })
});

export default reducers;
