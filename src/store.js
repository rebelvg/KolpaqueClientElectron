import {createStore, applyMiddleware} from 'redux'
import {createLogger} from 'redux-logger';
import thunk from 'redux-thunk';

import reducers from './reducers';

const logger = createLogger({
    level: "error"
});

const store = createStore(reducers, applyMiddleware(thunk));

export default store;
