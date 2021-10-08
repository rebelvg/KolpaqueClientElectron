import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';

const { ipcRenderer } = window.require('electron');

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
    ipcRenderer.on('config_changeSetting', () => {
      const settings = getSettings();

      this.setState({
        settings,
      });
    });

    ipcRenderer.send('client_ready');
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('config_changeSetting');
  }

  render() {
    const { settings } = this.state;

    const theme = settings.nightMode
      ? themes['nightTheme']
      : themes['defaultTheme'];

    return (
      <Container>
        <ThemeProvider theme={theme}>
          <HashRouter>
            <Container>
              <Routes settings={settings} />
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
