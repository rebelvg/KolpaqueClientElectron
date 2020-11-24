import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';

const AUTOSTART_ON = './static/icons/autostart_on.svg';
const AUTOSTART_ON_INVERT = './static/icons/autostart_on_invert.svg';
const AUTOSTART_OFF = './static/icons/autostart_off.svg';

@withTheme
class AutoStart extends Component {
  onClick = (e) => {
    const {
      channel: { autoStart, id },
      toggle,
    } = this.props;
    e.preventDefault();
    e.stopPropagation();
    toggle(id, 'autoStart', !autoStart);
  };

  getIcon = () => {
    const {
      channel: { autoStart },
      theme,
    } = this.props;
    if (autoStart) {
      return theme.nightMode ? AUTOSTART_ON_INVERT : AUTOSTART_ON;
    } else return AUTOSTART_OFF;
  };

  render() {
    return (
      <Wrapper onClick={this.onClick}>
        <img width="12px" height="12px" src={this.getIcon()} />
      </Wrapper>
    );
  }
}

export default AutoStart;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  height: 20px;
  margin-right: 4px;
`;
