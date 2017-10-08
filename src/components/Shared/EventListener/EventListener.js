import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {initChannels, changeStatus, deleteChannel, addChannel} from '../../../redux/actions/channels'
import {initSettings} from '../../../redux/actions/settings'
import {Link} from 'react-router-dom';
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
            this.props.addChannel(channelObj);
        });
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
        addChannel
    }, dispatch)
)(EventListener);
