import React, { Component } from 'react';
import { withTheme } from 'styled-components';
import ReactJson from 'react-json-view';
import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

@withTheme
export default class LogsForm extends Component<any, any> {
  getLogsInterval;

  constructor(props) {
    super(props);

    this.getLogsInterval;

    this.state = {
      logs: [],
    };
  }

  async componentDidMount() {
    const logs = await ipcRenderer.invoke('config_logs');

    this.setState({
      logs,
    });

    this.getLogsInterval = setInterval(async () => {
      const logs = await ipcRenderer.invoke('config_logs');

      this.setState({
        logs,
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
