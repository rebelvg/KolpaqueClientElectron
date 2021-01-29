import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { withTheme } from 'styled-components';

import {
  changeSettings,
  changeSettingsResponse,
  importChannel,
  getSettings,
} from '../../redux/settings';
import { updateData } from '../../redux/channel';
import Settings from '../../Settings/Components/Settings';
import { getVersion } from '../../Channel/Helpers/IPCHelpers';
import { IpcRenderer } from 'electron';

const {
  ipcRenderer,
}: { remote: any; ipcRenderer: IpcRenderer } = window.require('electron');

@withTheme
@connect(
  (state) => ({
    settings: getSettings(state),
  }),
  { changeSettings, changeSettingsResponse, importChannel, updateData },
)
export default class SettingsContainer extends Component<any, any> {
  constructor(props) {
    super(props);

    const version = getVersion();

    this.state = {
      version,
    };
  }

  private changeSettingHandler = (e, settingName, settingValue) => {
    this.props.updateData();

    this.props.changeSettingsResponse(settingName, settingValue);
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
    const { settings } = this.props;
    const { version } = this.state;

    return (
      <Container>
        <Settings
          importChannel={this.props.importChannel}
          changeSettings={this.props.changeSettings}
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
