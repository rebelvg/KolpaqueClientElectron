import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form'
import channel from './channels';

const reducers = combineReducers({
	channel,
	form: formReducer
});

export default reducers;
