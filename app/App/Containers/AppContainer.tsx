import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';

import Routes from '../../App/Components/Routes';
import EventListener from '../../App/Components/EventListener';
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

  render() {
    const { nightMode } = this.state;

    const theme = nightMode ? themes['nightTheme'] : themes['defaultTheme'];

    return (
      <Container>
        <ThemeProvider theme={theme}>
          <HashRouter>
            <Container>
              <Routes />
              <EventListener />
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
