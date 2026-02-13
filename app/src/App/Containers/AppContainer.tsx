import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';

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
    this.cleanup = window.electronAPI.on('config_changeSetting_api', () => {
      const { settings, integrations } = getSettings();

      this.setState({
        settings,
        integrations,
      });
    });

    window.electronAPI.send('client_ready');
  }

  componentWillUnmount() {
    if (this.cleanup) {
      this.cleanup();
    }
  }

  private cleanup: (() => void) | null = null;

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
