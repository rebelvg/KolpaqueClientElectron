import { createActions, handleActions, createAction } from 'redux-actions';
import { createSelector } from 'reselect';
import { getTab } from 'src/Channel/constants';

const { ipcRenderer } = window.require('electron');

const defaultState = {
  channels: [],
  update: false,
  count: { online: 0, offline: 0 },
  filter: '',
  loading: true,
  loaded: false,
  activeTab: 'online'
};

//ACTIONS
export const updateData = (filter = null, activeTab = null) => {
  return (dispatch, getState) => {
    if (filter === null) {
      filter = getState().channel.filter;
    }

    if (!activeTab) {
      activeTab = getState().channel.activeTab;
    }

    const tab = getTab(activeTab);

    const query = { filter, [tab.filter]: tab.filterValue };
    const data = ipcRenderer.sendSync('config_find', query);
    dispatch(updateView({ ...data, filter, activeTab }));
  };
};

export const { initStart, initEnd, updateView, changeTab, getInfo, sendInfo, setFilter } = createActions({
  INIT_START: () => {
    ipcRenderer.send('client_ready');
    return {};
  },
  INIT_END: () => ({}),

  UPDATE_VIEW: data => ({ ...data }),

  CHANGE_TAB: tab => ({ tab }),

  GET_INFO: info => ({ info }),

  SEND_INFO: info => {
    ipcRenderer.send('client_getInfo', info);
    return { info };
  },

  SET_FILTER: filter => ({ filter })
});

//REDUCER
export const reducer = handleActions(
  {
    INIT_START: (state, action) => ({
      ...state
    }),
    INIT_END: (state, action) => ({
      ...state,
      loaded: true
    }),

    UPDATE_VIEW: (state, action) => ({
      ...state,
      ...action.payload
    }),

    CHANGE_TAB: (state, action) => ({ ...state, activeTab: action.payload.tab }),

    GET_INFO: (state, action) => ({ ...state, update: action.payload.info }),

    SEND_INFO: (state, action) => ({ ...state }),

    SET_FILTER: (state, action) => {
      return { ...state, filter: action.payload.filter };
    }
  },
  defaultState
);

//SELECTORS
export const getChannelsList = state => state.channel.channels;
export const getCount = state => state.channel.count;
export const getFilter = state => state.channel.filter;
export const getActiveTab = state => state.channel.activeTab;
export const getUpdate = state => state.channel.update;
export const getLoading = state => state.channel.loading;
export const getLoaded = state => state.channel.loaded;
