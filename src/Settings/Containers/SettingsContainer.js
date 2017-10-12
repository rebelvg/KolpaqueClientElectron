import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getSettings} from '../../Settings/Reducers/SettingsReducer'
import Settings from '../Components/Settings/Settings'

const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class SettingsContainer extends Component {
    constructor() {
        super()
        this.state = {}
    }

    render() {
        const {settings} = this.props;
        const {selected, tab} = this.state;
        return (
            <Container>
                <Settings settings={settings}/>
                <StyledLink to="/">back</StyledLink>
            </Container>
        );
    }
}

const Container = styled.div`
   width: 100%;
   height: 100%;
`

const StyledLink = styled(Link)`
    position: absolute;
    bottom: 0px;
`

export default connect(
    (state) => ({
        settings: getSettings(state)
    }),
    (dispatch) => bindActionCreators({}, dispatch)
)(SettingsContainer);
