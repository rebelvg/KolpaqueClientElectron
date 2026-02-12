import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import styled, { withTheme } from 'styled-components';
import { star } from 'react-icons-kit/fa/star';
import { Channel } from '../../Shared/types';
import { DefaultTheme } from 'styled-components';

interface PinButtonProps {
  channel: Channel;
  toggle: (id: string, name: keyof Channel, value: boolean) => void;
  theme?: DefaultTheme;
}

@withTheme
export class PinButton extends Component<PinButtonProps> {
  onClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
          color={!isPinned ? '#979797' : (theme?.client.color ?? '#979797')}
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
  color: ${(props) => (props.color ? props.color : 'darkgreen')};
`;
