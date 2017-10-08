import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getSettings} from '../../redux/reducers/settings'
import './style.css';
import Settings from '../../components/Settings/Settings'

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
            <div>
                <Settings settings={settings}/>
                <Link to="/">back</Link>
            </div>
        );
    }
}

export default connect(
    (state) => ({
        settings: getSettings(state)
    }),
    (dispatch) => bindActionCreators({}, dispatch)
)(SettingsContainer);
