import React from 'react';
import Icon from 'react-icons-kit';
import styled, { DefaultTheme, useTheme } from 'styled-components';
import { star } from 'react-icons-kit/fa/star';
import { Channel } from '../../Shared/types';

interface PinButtonProps {
  channel: Channel;
  toggle: (id: string, name: keyof Channel, value: boolean) => void;
}

export const PinButton: React.FC<PinButtonProps> = ({ channel, toggle }) => {
  const theme = useTheme() as DefaultTheme;

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { isPinned, id } = channel;

    e.preventDefault();
    e.stopPropagation();
    toggle(id, 'isPinned', !isPinned);
  };

  const { isPinned } = channel;

  return (
    <Wrapper onClick={onClick}>
      <PinnedIcon
        icon={star}
        color={!isPinned ? '#979797' : (theme?.client.color ?? '#979797')}
      />
    </Wrapper>
  );
};

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
