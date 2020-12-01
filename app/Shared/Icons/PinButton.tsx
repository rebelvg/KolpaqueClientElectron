import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import styled, { withTheme } from 'styled-components';
import { star } from 'react-icons-kit/fa/star';

@withTheme
export class PinButton extends Component<any> {
  onClick = (e) => {
    const {
      channel: { isPinned, id },
      toggle,
    } = this.props;
    e.preventDefault();
    e.stopPropagation();
    toggle(id, 'isPinned', !isPinned);
  };

  render() {
    const {
      channel: { isPinned },
      theme,
    } = this.props;
    return (
      <Wrapper onClick={this.onClick}>
        <PinnedIcon
          icon={star}
          color={!isPinned ? '#979797' : theme.client.color}
        />
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

const PinnedIcon = styled(Icon)`
  width: 13px;
  height: 13px;
  color: ${(props) => (!!props.color ? props.color : 'darkgreen')};
`;
