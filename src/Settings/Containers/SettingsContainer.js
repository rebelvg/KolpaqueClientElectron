import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getSettings} from '../../Settings/Reducers/SettingsReducer'
import {changeSettings, changeSettingsResponse} from '../../Settings/Actions/SettingsActions'
import Settings from '../Components/Settings/Settings'
import {withTheme} from 'styled-components'
import theme from '../../theme'
const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class SettingsContainer extends Component {
    constructor() {
        super()
        const version = ipcRenderer.sendSync("client_getVersion");

        this.state = {
            version
        }
    }

    componentWillMount() {
        ipcRenderer.on('config_changeSetting', (settingName, settingValue) => {
            this.props.changeSettingsResponse(settingName, settingValue)
        })
    }

    render() {
        const {settings} = this.props;
        const {selected, tab, version} = this.state;
        return (
            <Container>
                <Settings changeSettings={this.props.changeSettings} settings={settings}/>
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
    background-color: ${theme.client.bg};
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
`
const StyledLink = styled(Link)`
   margin-left: 10px;
`

export default withTheme(connect(
    (state) => ({
        settings: getSettings(state)
    }),
    (dispatch) => bindActionCreators({
        changeSettings,
        changeSettingsResponse
    }, dispatch)
)(SettingsContainer));
