import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { withTheme } from 'styled-components';

import { updateData } from '../../redux/channel';
import Settings from '../../Settings/Components/Settings';
import {
  changeSetting,
  getSettings,
  getVersion,
  importChannel,
} from '../../Channel/Helpers/IPCHelpers';
import { IpcRenderer } from 'electron';

const {
  ipcRenderer,
}: { remote: any; ipcRenderer: IpcRenderer } = window.require('electron');

@withTheme
@connect(() => ({}), {
  updateData,
})
export default class SettingsContainer extends Component<any, any> {
  constructor(props) {
    super(props);

    const settings = getSettings();

    const version = getVersion();

    this.state = {
      settings,
      version,
    };
  }

  private changeSettingHandler = (e, settingName, settingValue) => {
    const settings = getSettings();

    this.setState({
      settings,
    });

    this.props.updateData();
  };

  componentWillMount() {
    ipcRenderer.on('config_changeSetting', this.changeSettingHandler);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(
      'config_changeSetting',
      this.changeSettingHandler,
    );
  }

  render() {
    const { settings, version } = this.state;

    return (
      <Container>
        <Settings
          importChannel={importChannel}
          changeSettings={changeSetting}
          settings={settings}
        />
        <StyledFooter>
          <StyledLink to="/">Back</StyledLink>
          <Version> {version} </Version>
        </StyledFooter>
      </Container>
    );
  }
}

const StyledFooter = styled.div`
  position: absolute;
  bottom: 0px;
  display: flex;
  background-color: ${(props) => props.theme.client.bg};
  padding: 5px 0px;
  width: 100%;
  justify-content: space-between;
`;
const Container = styled.div`
  width: 100%;
  height: 100%;
`;
const Version = styled.div`
  margin-right: 10px;
  color: ${(props) => props.theme.client.color};
`;
const StyledLink = styled(Link)`
  margin-left: 10px;
  color: ${(props) => props.theme.client.color};
  text-decoration: none;
  cursor: pointer;
`;
