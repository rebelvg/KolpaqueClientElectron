import React, {Component} from 'react';
import {connect} from 'react-redux';
import {getChannels, changeSetting, deleteChannel, addChannelResponse, getInfo, getLoaded} from '../../redux/channel'
import {initSettings} from '../../redux/settings'
import styled from 'styled-components';

const {ipcRenderer} = window.require('electron');

@connect(
    state => ({
        loaded: getLoaded(state)
    }),
    {
        initSettings,
        getChannels,
        changeSetting,
        deleteChannel,
        addChannelResponse,
        getInfo
    }
)
class EventListener extends Component {
    constructor() {
        super()
    }

    componentWillMount() {
        const {initSettings, getChannels, changeSetting, addChannelResponse, getInfo, deleteChannel, loaded} = this.props;
        if (!loaded) {
            getChannels();
            initSettings();
            ipcRenderer.on('channel_changeSetting',
                (event, id, name, value) => changeSetting(id, name, value));
            ipcRenderer.on('channel_add',
                (event, channel) => addChannelResponse(channel));
            ipcRenderer.on('client_showInfo', (event, info) => getInfo(info));
            ipcRenderer.on('channel_remove', (event, id) => {
                deleteChannel(id);
            });
        }
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

export default EventListener

