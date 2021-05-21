import React, { Component } from 'react';
import styled from 'styled-components';

import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

class EventListener extends Component<any> {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    ipcRenderer.send('client_ready');
  }

  render() {
    return <EventContainer />;
  }
}

const EventContainer = styled.div`
  display: none;
`;

export default EventListener;
