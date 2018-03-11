import React, {Component} from 'react';
import {connect} from 'react-redux';
import styled from 'styled-components';
import {debounce} from 'lodash';

import {
    initStart,
    initEnd,
    updateData,
    getInfo,
    getLoaded,
} from 'src/redux/channel';
import {initSettings} from 'src/redux/settings';

const {ipcRenderer} = window.require('electron');

@connect(
    state => ({
        loaded: getLoaded(state)
    }),
    {
        initSettings,
        getInfo,
        initStart,
        initEnd,
        updateData,
    }
)
class EventListener extends Component {
    constructor() {
        super();

        this.state = {
            queue: []
        };

        this.empty = debounce(this.emptyQueue, 0);
    }

    emptyQueue = () => {
        const {queue} = this.state;
        const {initEnd, updateData, loaded} = this.props;

        this.setState({
            queue: []
        }, () => {
            updateData();
            if (!loaded) {
                initEnd();
            }
        })
    };

    componentWillMount() {
        const {initSettings, updateData, loaded, getInfo, initStart} = this.props;

        if (!loaded) {
            initStart();
            initSettings();

            this.empty();

            ipcRenderer.on('channel_changeSettingSync', (event) => updateData());
            ipcRenderer.on('channel_addSync', (event) => updateData());
            ipcRenderer.on('client_showInfo', (event, info) => getInfo(info));
            ipcRenderer.on('channel_removeSync', (event) => updateData());
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
`;

export default EventListener
