import { combineReducers } from 'redux';

import { reducer as channel } from '../redux/channel';

const reducers = combineReducers({
  channel,
});

export default reducers;
