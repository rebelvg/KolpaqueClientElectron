import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import styled from 'styled-components';

import ChannelContainer from '../../Channel/Containers/ChannelContainer';
import SettingsContainer from '../../Settings/Containers/SettingsContainer';

import { IpcRenderer } from 'electron';
import Loading from '../../Shared/Loading';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } =
  window.require('electron');

class Routes extends Component<any, any> {
  constructor(props) {
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
        <Route
          exact
          path="/"
          render={(props) => (
            <ChannelContainer
              updateNotification={updateNotification}
              {...props}
            />
          )}
        />
        <Route
          path="/about"
          render={(props) => (
            <SettingsContainer
              settings={settings}
              integrations={integrations}
              {...props}
            />
          )}
        />
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
