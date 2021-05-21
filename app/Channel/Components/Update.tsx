import React, { Component } from 'react';
import styled from 'styled-components';

import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

export default class Update extends Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      info: '',
    };
  }

  componentDidMount() {
    ipcRenderer.on('client_showInfo', (_event, info) => {
      this.setState({
        info,
      });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('client_showInfo');
  }

  sendInfo = () => ipcRenderer.send('client_getInfo');

  render() {
    const { info } = this.state;

    return (
      <div>
        {info && (
          <UpdateWrapper
            onClick={() => {
              this.sendInfo();
            }}
          >
            {info}
          </UpdateWrapper>
        )}
      </div>
    );
  }
}

const UpdateWrapper = styled.div`
  position: fixed;
  bottom: 23px;
  width: calc(100% - 22px);
  font-size: 14px;
  text-align: center;
  color: #9f2dff;
  text-decoration: underline;
  z-index: 0;
  left: 17px;
  padding: 5px 0px;
  border: 1px solid ${(props) => props.theme.outline};
  cursor: pointer;
  background-color: ${(props) => props.theme.clientSecondary.bg};
`;
