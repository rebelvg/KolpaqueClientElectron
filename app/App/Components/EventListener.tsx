import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { debounce } from 'lodash';

import {
  initStart,
  initEnd,
  updateData,
  getInfo,
  getLoaded,
} from '../../redux/channel';
import { initSettings } from '../../redux/settings';

const { ipcRenderer } = window.require('electron');

@connect(
  (state) => ({
    loaded: getLoaded(state),
  }),
  {
    initSettings,
    getInfo,
    initStart,
    initEnd,
    updateData,
  },
)
class EventListener extends Component<any> {
  empty;

  constructor(props) {
    super(props);

    this.state = {
      queue: [],
    };

    this.empty = debounce(this.emptyQueue, 0);
  }

  emptyQueue = () => {
    const { initEnd, updateData, loaded } = this.props;

    this.setState(
      {
        queue: [],
      },
      () => {
        updateData();

        if (!loaded) {
          initEnd();
        }
      },
    );
  };

  componentDidMount() {
    const { initSettings, updateData, loaded, getInfo, initStart } = this.props;

    if (!loaded) {
      ipcRenderer.on('channel_changeSettingSync', () => updateData());
      ipcRenderer.on('channel_addSync', () => updateData());
      ipcRenderer.on('client_showInfo', (_event, info) => getInfo(info));
      ipcRenderer.on('channel_removeSync', () => updateData());

      initStart();
      initSettings();

      setTimeout(this.empty, 3000);
    }
  }

  render() {
    return <EventContainer />;
  }
}

const EventContainer = styled.div`
  display: none;
`;

export default EventListener;
