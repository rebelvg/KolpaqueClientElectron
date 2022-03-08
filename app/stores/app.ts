import { makeObservable, observable, action, runInAction } from 'mobx';

import { IpcRenderer } from 'electron';
import { THEMES, APP_EVENTS} from '../constants';
const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

class AppStore {
  hasLoaded = false;
  settings = {nightMode: false};
  updateString = '';
  constructor() {
    makeObservable(this, {
      hasLoaded: observable,
      updateString: observable,
      finishLoading: action,
      setUpdateString: action,
      clearIPCReactions: action,
      initIPCReactions: action,
      notifyReady: action,
      getSettings: action,
    });
    this.initIPCReactions();
    this.getSettings();
  }

  notifyReady = () => {
    ipcRenderer.send(APP_EVENTS.CLIENT_READY);
  };

  initIPCReactions = () => {
    ipcRenderer.on(APP_EVENTS.BACKEND_READY, () => {
      this.finishLoading();
    });

    ipcRenderer.on(APP_EVENTS.CONFIG_CHANGE, () => {
      this.getSettings();
    });

    ipcRenderer.on(APP_EVENTS.SHOW_INFO, (_event, updateNotification) => {
      this.setUpdateString(updateNotification);
    });
  };

  clearIPCReactions = () => {
    ipcRenderer.removeAllListeners(APP_EVENTS.BACKEND_READY);
    ipcRenderer.removeAllListeners(APP_EVENTS.SHOW_INFO);
  };

  getSettings = () => {
    this.settings = ipcRenderer.sendSync(APP_EVENTS.GET_SETTINGS);
  };

  finishLoading = () =>
    runInAction(() => {
      this.hasLoaded = true;
    });

  setUpdateString = (updateString: '') => {
    runInAction(() => {
      this.updateString = updateString;
    });
  };

  get appTheme() {
    if (!this.settings) {
      return THEMES.LIGHT;
    }

    return this.settings.nightMode ? THEMES.NIGHT : THEMES.LIGHT;
  }
}

export default AppStore;
