import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';

import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

import Routes from '../../App/Components/Routes';
import { themes } from '../../Themes';
import { getSettings } from '../../Channel/Helpers/IPCHelpers';

export default class AppContainer extends Component<any, any> {
  constructor(props) {
    super(props);

    const settings = getSettings();

    this.state = {
      settings,
    };
  }

  componentDidMount() {
    ipcRenderer.send('client_ready');
  }

  render() {
    const { nightMode } = this.state;

    const theme = nightMode ? themes['nightTheme'] : themes['defaultTheme'];

    return (
      <Container>
        <ThemeProvider theme={theme}>
          <HashRouter>
            <Container>
              <Routes />
            </Container>
          </HashRouter>
        </ThemeProvider>
      </Container>
    );
  }
}

const Container = styled.div`
  height: 100%;
`;
