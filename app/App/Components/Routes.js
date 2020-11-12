import React from 'react';
import { Route } from 'react-router-dom';
import styled from 'styled-components';

import ChannelContainer from 'src/Channel/Containers/ChannelContainer';
import SettingsContainer from 'src/Settings/Containers/SettingsContainer';

const Routes = () => (
  <RouterWrapper>
    <Route exact path="/" component={ChannelContainer} />
    <Route path="/about" component={SettingsContainer} />
  </RouterWrapper>
);

export default Routes;

const RouterWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;
