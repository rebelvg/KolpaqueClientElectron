import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form'
import channel from './Channel/Reducers/ChannelReducers';
import settings from './Settings/Reducers/SettingsReducer';

const reducers = combineReducers({
    channel,
    settings,
    form: formReducer
});

export default reducers;
