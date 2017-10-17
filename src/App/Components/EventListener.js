import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {initChannels, changeStatus, deleteChannel, addChannelResponse, getInfo} from '../../Channel/Actions/ChannelActions'
import {initSettings} from '../../Settings/Actions/SettingsActions'
import styled from 'styled-components';

const {ipcRenderer} = window.require('electron');

class EventListener extends Component {
    constructor() {
        super()
    }

    componentWillMount() {
        this.props.initChannels();
        this.props.initSettings();
        ipcRenderer.on('channel_changeSetting', (event, id, settingName, settingValue) => this.props.changeStatus(id, settingName, settingValue));
        ipcRenderer.on('channel_add', (event, channelObj) => {
            this.props.addChannelResponse(channelObj);
        });
        ipcRenderer.on('client_showInfo', (event, info) => {
            this.props.getInfo(info);
        })
        ipcRenderer.on('channel_remove', (event, id) => {
            this.props.deleteChannel(id);
        });
    }

    render() {
        return (
            <EventContainer/>
        );
    }
}

const EventContainer = styled.div`
	display:none
`

export default connect(
    (state) => ({}),
    (dispatch) => bindActionCreators({
        initSettings,
        initChannels,
        changeStatus,
        deleteChannel,
        addChannelResponse,
        getInfo
    }, dispatch)
)(EventListener);
