import React, { Component } from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';
import styled from 'styled-components';

import ChannelContainer from '../../Channel/Containers/ChannelContainer';
import SettingsContainer from '../../Settings/Containers/SettingsContainer';

import Loading from '../../Shared/Loading';
import { Integrations, Settings } from '../../Shared/types';

interface RoutesProps {
  settings: Settings;
  integrations: Integrations;
}

interface RoutesState {
  isLoading: boolean;
  updateNotification: string;
}

class Routes extends Component<RoutesProps, RoutesState> {
  constructor(props: RoutesProps) {
    super(props);

    const backendReadyCleanup = window.electronAPI.on('backend_ready', () => {
      this.setState({
        isLoading: false,
      });
    });

    const showInfoCleanup = window.electronAPI.on(
      'client_showInfo',
      (_event, updateNotification) => {
        this.setState({
          updateNotification: updateNotification as string,
        });
      },
    );

    this.state = {
      isLoading: true,
      updateNotification: '',
    };

    this.cleanupFns = [backendReadyCleanup, showInfoCleanup];
  }

  private cleanupFns: Array<() => void> = [];

  componentWillUnmount() {
    this.cleanupFns.forEach((fn) => fn && fn());
  }

  render() {
    const { settings, integrations } = this.props;
    const { isLoading, updateNotification } = this.state;

    if (isLoading) {
      return <Loading />;
    }

    return (
      <RouterWrapper>
        <RouterRoutes>
          <Route
            path="/"
            element={
              <ChannelContainer updateNotification={updateNotification} />
            }
          />
          <Route
            path="/about"
            element={
              <SettingsContainer
                settings={settings}
                integrations={integrations}
              />
            }
          />
        </RouterRoutes>
      </RouterWrapper>
    );
  }
}

export default Routes;

const RouterWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;
