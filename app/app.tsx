import React, { useEffect } from 'react';
import { useStores } from './hooks/use-stores';
import styled from 'styled-components';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { themes } from './Themes';
import {Routes} from './routes';

export const App = () => {
  const { app } = useStores();

  useEffect(() => {
    app.notifyReady();
  }, []);

  const currentTheme = app.appTheme;
  const theme = themes[currentTheme];

  return (
    <Container>
      <ThemeProvider theme={theme}>
        <HashRouter>
          <Container>
            <Routes/>
          </Container>
        </HashRouter>
      </ThemeProvider>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
`;
