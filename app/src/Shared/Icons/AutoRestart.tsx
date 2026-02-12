import React from 'react';
import Icon from 'react-icons-kit';
import styled, { DefaultTheme, useTheme } from 'styled-components';
import { refresh } from 'react-icons-kit/fa/refresh';
import { Channel } from '../../Shared/types';

interface AutoRestartProps {
  channel: Channel;
  toggle: (id: string, name: keyof Channel, value: boolean) => void;
}

export const AutoRestart: React.FC<AutoRestartProps> = ({
  channel,
  toggle,
}) => {
  const theme = useTheme() as DefaultTheme;

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { id, onAutoRestart, autoRestart } = channel;

    e.preventDefault();
    e.stopPropagation();
    if (onAutoRestart) {
      toggle(id, 'onAutoRestart', !onAutoRestart);
    } else {
      toggle(id, 'autoRestart', !autoRestart);
    }
  };

  const getColor = () => {
    const { onAutoRestart, autoRestart } = channel;

    if (onAutoRestart) {
      return '#119400';
    } else {
      return autoRestart ? (theme?.client.color ?? '#979797') : '#979797';
    }
  };

  return (
    <Wrapper onClick={onClick}>
      <IconBase icon={refresh} style={{ color: getColor() }} />
    </Wrapper>
  );
};

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
