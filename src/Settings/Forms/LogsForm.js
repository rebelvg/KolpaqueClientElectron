const { remote, ipcRenderer } = window.require('electron');

import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';
import ReactJson from 'react-json-view';

@withTheme
export default class LogsForm extends Component {
  constructor() {
    super();

    this.getLogsInterval;

    this.state = {
      logs: []
    };
  }

  componentDidMount() {
    this.getLogsInterval = setInterval(() => {
      const logs = ipcRenderer.sendSync('config_logs');

      this.setState({
        logs
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.getLogsInterval);
  }

  render() {
    return <ReactJson src={this.state.logs} collapsed={false} />;
  }
}
