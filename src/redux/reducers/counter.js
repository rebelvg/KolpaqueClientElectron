import { handleActions } from 'redux-actions';

import * as actions from 'src/redux/constants/counter';

const initialState = { count: 0 };

const reducer = handleActions({
  [actions.COUNTER_ADD]: (state) => {
    return { count: state.count + 1 }
  },
  [actions.COUNTER_SUBTRACT]: (state) => {
    if (state.count > 0) {
      return { count: state.count - 1};
    } else {
      return state;
    }
  }
}, initialState);

export default reducer;
