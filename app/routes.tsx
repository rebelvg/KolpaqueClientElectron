import React from 'react';
import { Route } from 'react-router-dom';
import styled from 'styled-components';

import ChannelContainer from './Channel/Containers/ChannelContainer';
import SettingsContainer from './Settings/Containers/SettingsContainer';

import Loading from './Shared/Loading';
import { useStores } from './hooks/use-stores';

export const Routes = () => {
  const { app } = useStores();

  // eslint-disable-next-line no-console
  console.log(app.hasLoaded);

  if (!app.hasLoaded) {
    return <Loading />;
  }

  return (
    <RouterWrapper>
      <Route
        exact
        path="/"
        render={(props) => (
          <ChannelContainer updateNotification={app.updateString} {...props} />
        )}
      />
      <Route
        path="/about"
        render={(props) => (
          <SettingsContainer settings={app.settings} {...props} />
        )}
      />
    </RouterWrapper>
  );
};

const RouterWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;
