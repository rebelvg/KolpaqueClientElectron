import {combineReducers} from 'redux';

import {reducer as channel} from 'src/redux/channel';
import {reducer as settings} from 'src/redux/settings';

const reducers = combineReducers({
    channel,
    settings,
});

export default reducers;
