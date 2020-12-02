import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reducers from './redux';

const store = createStore(
  reducers,
  window['__REDUX_DEVTOOLS_EXTENSION__'] &&
    window['__REDUX_DEVTOOLS_EXTENSION__'](),
  applyMiddleware(thunk),
);

export default store;
