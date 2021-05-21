import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import styled from 'styled-components';

import ChannelContainer from '../../Channel/Containers/ChannelContainer';
import SettingsContainer from '../../Settings/Containers/SettingsContainer';

import { IpcRenderer } from 'electron';
import Loading from '../../Shared/Loading';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

class Routes extends Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
    };

    ipcRenderer.on('backend_ready', () => {
      this.setState({
        isLoading: false,
      });
    });
  }

  render() {
    const { isLoading } = this.state;

    if (isLoading) {
      return <Loading />;
    }

    return (
      <RouterWrapper>
        <Route exact path="/" component={ChannelContainer} />
        <Route path="/about" component={SettingsContainer} />
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
