import React, { Component } from 'react';
import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } =
  window.require('electron');

interface LogsFormState {
  logs: unknown[];
}

export default class LogsForm extends Component<
  Record<string, never>,
  LogsFormState
> {
  getLogsInterval: NodeJS.Timeout | undefined;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      logs: [],
    };
  }

  async componentDidMount(): Promise<void> {
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

  componentWillUnmount(): void {
    if (this.getLogsInterval) {
      clearInterval(this.getLogsInterval);
    }
  }

  render() {
    return (
      <div>
        <button
          onClick={() => {
            ipcRenderer.send('logs_open_folder');
          }}
        >
          Show Folder
        </button>
      </div>
    );
  }
}
