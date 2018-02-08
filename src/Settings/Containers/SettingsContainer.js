import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import styled, {withTheme} from 'styled-components';

import {
    changeSettings,
    changeSettingsResponse,
    importChannel,
    getSettings
} from 'src/redux/settings'
import Settings from 'src/Settings/Components/Settings/Settings'

const {remote, ipcRenderer} = window.require('electron');

@withTheme
@connect(
    state => ({
        settings: getSettings(state)
    }),
    {changeSettings, changeSettingsResponse, importChannel}
)
export default class SettingsContainer extends Component {
    constructor() {
        super()
        const version = ipcRenderer.sendSync("client_getVersion");

        this.state = {
            version
        }
    }

    componentWillMount() {
        ipcRenderer.on('config_changeSetting', (e, settingName, settingValue) => {
            this.props.changeSettingsResponse(settingName, settingValue)
        })
    }

    render() {
        const {settings} = this.props;
        const {version} = this.state;
        return (
            <Container>
                <Settings importChannel={this.props.importChannel}
                          changeSettings={this.props.changeSettings}
                          settings={settings}/>
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
    background-color: ${props => props.theme.client.bg};
    padding: 5px 0px;
    width:100%;
    justify-content: space-between;
`
const Container = styled.div`
   width: 100%;
   height: 100%;
`
const Version = styled.div`
    margin-right: 10px;
    color: ${props => props.theme.client.color}
`
const StyledLink = styled(Link)`
   margin-left: 10px;
   color: ${props => props.theme.client.color};
   text-decoration: none;
   cursor: pointer;
`


