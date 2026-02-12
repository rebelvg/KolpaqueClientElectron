import React, { Component } from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';
import styled from 'styled-components';

import ChannelContainer from '../../Channel/Containers/ChannelContainer';
import SettingsContainer from '../../Settings/Containers/SettingsContainer';

import { IpcRenderer } from 'electron';
import Loading from '../../Shared/Loading';
import { Integrations, Settings } from '../../Shared/types';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } =
  window.require('electron');

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

    this.state = {
      isLoading: true,
      updateNotification: '',
    };

    ipcRenderer.on('backend_ready', () => {
      this.setState({
        isLoading: false,
      });
    });

    ipcRenderer.on('client_showInfo', (_event, updateNotification) => {
      this.setState({
        updateNotification,
      });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('client_showInfo');
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
            element={<ChannelContainer updateNotification={updateNotification} />}
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
