import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';

const AUTOSTART_ON = './icons/autostart_on.svg';
const AUTOSTART_ON_INVERT = './icons/autostart_on_invert.svg';
const AUTOSTART_OFF = './icons/autostart_off.svg';

@withTheme
export class AutoStart extends Component<any> {
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
    } else {
      return AUTOSTART_OFF;
    }
  };

  render() {
    return (
      <Wrapper onClick={this.onClick}>
        <img width="12px" height="12px" src={this.getIcon()} />
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  height: 20px;
  margin-right: 4px;
`;
