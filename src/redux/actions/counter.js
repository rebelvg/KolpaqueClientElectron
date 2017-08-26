import * as actions from 'src/redux/constants/counter';

console.log(actions);

export function add() {
  return (dispatch) => {
    dispatch({ type: actions.COUNTER_ADD });
  }
}

export function subtract() {
  return (dispatch) => {
    dispatch({ type: actions.COUNTER_SUBTRACT });
  }
}
