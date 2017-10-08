import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form'
import channel from './channels';
import settings from './settings';

const reducers = combineReducers({
    channel,
    settings,
    form: formReducer
});

export default reducers;
