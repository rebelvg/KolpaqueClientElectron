import React, {Component} from 'react';
import {connect} from 'react-redux';
import styled from 'styled-components';
import {debounce} from 'lodash'

import {
    getChannels,
    changeSetting,
    deleteChannel,
    addChannelResponse,
    getInfo,
    getLoaded,
    initClient
} from 'src/redux/channel'
import {initSettings} from 'src/redux/settings'

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
        getInfo,
        initClient
    }
)
class EventListener extends Component {
    constructor() {
        super()
        this.state = {
            queue: []
        }
        this.empty = debounce(this.emptyQueue, 300);
    }

    buildQueue = ({id, name, value}) => {
        const {queue} = this.state
        this.setState({
            queue: queue[id]
                ? {...queue, [id]: {...queue[id], [name]: value}}
                : {...queue, [id]: {[name]: value}}
        }, () => {
            this.empty()
        })
    }

    emptyQueue = () => {
        const {queue} = this.state
        const {initClient, changeSetting, loaded} = this.props;
        this.setState({
            queue: []
        }, () => {
            changeSetting(queue);
            if (!loaded) {
                initClient()
            }
        })
    }

    componentWillMount() {
        const {initSettings, getChannels, addChannelResponse, getInfo, deleteChannel, loaded} = this.props;

        if (!loaded) {
            getChannels();
            initSettings();
            this.empty();
            ipcRenderer.on('channel_changeSetting',
                (event, id, name, value) => this.buildQueue({id, name, value}));
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

