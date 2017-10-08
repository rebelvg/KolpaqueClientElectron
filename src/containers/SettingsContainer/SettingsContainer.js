import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getSettings} from '../../redux/reducers/settings'
import './style.css';


const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class SettingsContainer extends Component {
    constructor() {
        super()
        this.state = {}
    }

/* { "LQ": false, "showNotifications": true, "autoPlay": false, "minimizeAtStart": false, "launchOnBalloonClick": true, "enableLog": false, "theme": "light", "width": 409, "height": 743, "youtubeApiKey": null, "twitchImport": [ "rebelvg" ] }
 */
    render() {
        const {settings:{
            LQ,
            showNotifications,
            autoPlay,
            minimizeAtStart,
            launchOnBalloonClick,
            enableLog,
            youtubeApiKey,
            twitchImport,
        }} = this.props;
        const {selected, tab} = this.state;
        return (
            <div>
                <code>{JSON.stringify(settings, null, 6)}</code>
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
