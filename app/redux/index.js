import { combineReducers } from 'redux';

import { reducer as channel } from '../redux/channel';
import { reducer as settings } from '../redux/settings';

const reducers = combineReducers({
  channel,
  settings,
});

export default reducers;
