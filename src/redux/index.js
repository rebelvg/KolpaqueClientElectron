import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form'

import {reducer as channel} from '../redux/channel';
import settings from '../Settings/Reducers/SettingsReducer';

const reducers = combineReducers({
    channel,
    settings,
    form: formReducer
});

export default reducers;
