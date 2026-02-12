import React from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';
import { Channel } from '../../Shared/types';

const AUTOSTART_ON = './icons/autostart_on.svg';
const AUTOSTART_ON_INVERT = './icons/autostart_on_invert.svg';
const AUTOSTART_OFF = './icons/autostart_off.svg';

interface AutoStartProps {
  channel: Channel;
  toggle: (id: string, name: keyof Channel, value: boolean) => void;
}

export const AutoStart: React.FC<AutoStartProps> = ({ channel, toggle }) => {
  const theme = useTheme() as DefaultTheme;

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { autoStart, id } = channel;

    e.preventDefault();
    e.stopPropagation();
    toggle(id, 'autoStart', !autoStart);
  };

  const getIcon = () => {
    const { autoStart } = channel;

    if (autoStart) {
      return theme?.nightMode ? AUTOSTART_ON_INVERT : AUTOSTART_ON;
    } else {
      return AUTOSTART_OFF;
    }
  };

  return (
    <Wrapper onClick={onClick}>
      <img width="12px" height="12px" src={getIcon()} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  height: 20px;
  margin-right: 4px;
`;
