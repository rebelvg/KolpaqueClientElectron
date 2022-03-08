const STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

const CHANNEL_EVENTS = {
  ADD: 'channel_add',
  CHANGE_SYNC: 'channel_changeSettingSync',
  ADD_SYNC: 'channel_addSync',
  REMOVE_SYNC: 'channel_removeSync',
  FILTER: 'filter',
  CHANGE_TAB: 'handleActiveTab',
};

const APP_EVENTS = {
  CLIENT_READY: 'client_ready',
  BACKEND_READY: 'backend_ready',
  CONFIG_CHANGE: 'config_changeSetting',
  SHOW_INFO: 'client_showInfo',
  GET_SETTINGS: 'get_settings'
};

const THEMES = {
  LIGHT: 'defaultTheme',
  NIGHT: 'nightTheme',
};

export { STATUS, CHANNEL_EVENTS, APP_EVENTS, THEMES };
