import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import styled, { withTheme } from 'styled-components';
import { refresh } from 'react-icons-kit/fa/refresh';

@withTheme
export class AutoRestart extends Component<any> {
  onClick = (e) => {
    const {
      channel: { id, onAutoRestart, autoRestart },
      toggle,
    } = this.props;

    e.preventDefault();
    e.stopPropagation();
    if (onAutoRestart) {
      toggle(id, 'onAutoRestart', !onAutoRestart);
    } else {
      toggle(id, 'autoRestart', !autoRestart);
    }
  };

  getColor = () => {
    const {
      theme,
      channel: { onAutoRestart, autoRestart },
    } = this.props;

    if (onAutoRestart) {
      return '#119400';
    } else {
      return autoRestart ? theme.client.color : '#979797';
    }
  };

  render() {
    return (
      <Wrapper onClick={this.onClick}>
        <IconBase icon={refresh} style={{ color: this.getColor() }} />
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

const IconBase = styled(Icon)`
  width: 12px;
  height: 12px;
`;
