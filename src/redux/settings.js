import { createActions, handleActions } from 'redux-actions';

const { ipcRenderer } = window.require('electron');

const defaultState = {
  list: {}
};

export const { initSettings, importChannel, changeSettings, changeSettingsResponse } = createActions({
  INIT_SETTINGS: () => {
    const list = ipcRenderer.sendSync('getSettings');
    return { list };
  },
  IMPORT_CHANNEL: name => {
    ipcRenderer.send('config_twitchImport', name);
    return {};
  },
  CHANGE_SETTINGS: (name, value) => {
    ipcRenderer.send('config_changeSetting', name, value);
    return {};
  },
  CHANGE_SETTINGS_RESPONSE: (name, value) => ({
    name,
    value
  })
});

export const reducer = handleActions(
  {
    INIT_SETTINGS: (state, action) => ({
      ...state,
      list: action.payload.list
    }),
    IMPORT_CHANNEL: (state, action) => ({
      ...state
    }),
    CHANGE_SETTINGS: (state, action) => ({
      ...state
    }),
    CHANGE_SETTINGS_RESPONSE: (state, action) => ({
      ...state,
      list: {
        ...state.list,
        [action.payload.name]: action.payload.value
      }
    })
  },
  defaultState
);

export const getSortType = state => state.settings && state.settings.list.sortType;
export const getReversed = state => state.settings && state.settings.list.sortReverse;
export const getSettings = state => state.settings && state.settings.list;
export const getTheme = state => state.settings && state.settings.list && state.settings.list.nightMode;
export const getShowTooltips = state => state.settings && state.settings.list && state.settings.list.showTooltips;
