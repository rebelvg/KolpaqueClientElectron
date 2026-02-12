import React, { Component } from 'react';
import styled from 'styled-components';

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
    const logs = await window.electronAPI.invoke<unknown[]>('config_logs');

    this.setState({
      logs,
    });

    this.getLogsInterval = setInterval(async () => {
      const logs = await window.electronAPI.invoke<unknown[]>('config_logs');

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
      <LogsWrapper>
        <button
          onClick={() => {
            window.electronAPI.send('logs_open_folder');
          }}
        >
          Show Folder
        </button>
      </LogsWrapper>
    );
  }
}

const LogsWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;
