import React, { Component } from 'react';
import * as s from './style.css';

class Button extends Component {
  render() {
    const { children, onClick = () => {} } = this.props;

    return (
      <button onClick={onClick} className={s.buttonContainer}>
        {children}
      </button>
    )
  }
}

export default Button;
