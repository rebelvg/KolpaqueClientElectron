import React from 'react';
import Icon from 'react-icons-kit';
import styled from 'styled-components';
import { thumbTack } from 'react-icons-kit/fa/thumbTack';

export const Pinned: React.FC<Record<string, never>> = () => (
  <PinnedIcon icon={thumbTack} color={'#979797'} />
);

const PinnedIcon = styled(Icon)`
  width: 16px;
  height: 16px;
  color: ${(props) => (props.color ? props.color : 'darkgreen')};
`;
