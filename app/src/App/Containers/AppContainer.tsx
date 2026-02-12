import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';

const { ipcRenderer } = window.require('electron');

import Routes from '../../App/Components/Routes';
import { themes } from '../../Themes';
import { getSettings } from '../../Channel/Helpers/IPCHelpers';
import { Integrations, Settings } from '../../Shared/types';

interface AppContainerState {
  settings: Settings;
  integrations: Integrations;
}

export default class AppContainer extends Component<
  Record<string, never>,
  AppContainerState
> {
  constructor(props: Record<string, never>) {
    super(props);

    const { settings, integrations } = getSettings();

    this.state = {
      settings,
      integrations,
    };
  }

  componentDidMount() {
    ipcRenderer.on('config_changeSetting', () => {
      const { settings, integrations } = getSettings();

      this.setState({
        settings,
        integrations,
      });
    });

    ipcRenderer.send('client_ready');
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('config_changeSetting');
  }

  render() {
    const { settings, integrations } = this.state;

    const theme = settings.nightMode
      ? themes['nightTheme']
      : themes['defaultTheme'];

    return (
      <Container>
        <ThemeProvider theme={theme}>
          <HashRouter>
            <Container>
              <Routes settings={settings} integrations={integrations} />
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
