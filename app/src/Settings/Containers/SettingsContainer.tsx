import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import Settings from '../../Settings/Components/Settings';
import {
  changeSetting,
  getVersion,
  importChannel,
} from '../../Channel/Helpers/IPCHelpers';
import { Integrations, Settings as SettingsType } from '../../Shared/types';

interface SettingsContainerProps {
  settings: SettingsType;
  integrations: Integrations;
}

interface SettingsContainerState {
  version: string;
}

export default class SettingsContainer extends Component<
  SettingsContainerProps,
  SettingsContainerState
> {
  constructor(props: SettingsContainerProps) {
    super(props);

    const version = getVersion();

    this.state = {
      version,
    };
  }

  render() {
    const { settings, integrations } = this.props;
    const { version } = this.state;

    return (
      <Container>
        <Settings
          importChannel={importChannel}
          changeSettings={changeSetting}
          settings={settings}
          integrations={integrations}
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
