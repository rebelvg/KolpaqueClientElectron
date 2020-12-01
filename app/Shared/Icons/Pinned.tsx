import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import styled, { withTheme } from 'styled-components';
import { thumbTack } from 'react-icons-kit/fa/thumbTack';

@withTheme
export class Pinned extends Component {
  render() {
    return <PinnedIcon icon={thumbTack} color={'#979797'} />;
  }
}

const PinnedIcon = styled(Icon)`
  width: 16px;
  height: 16px;
  color: ${(props) => (!!props.color ? props.color : 'darkgreen')};
`;
