import React from 'react';
import Channels from './channels';
import App from './app';

export const storeContext = React.createContext({
  channels: new Channels(),
  app: new App(),
});
