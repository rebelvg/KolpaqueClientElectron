import {
  makeObservable,
  observable,
  action,
  computed,
  runInAction,
} from 'mobx';
import { getChannels } from '../Channel/Helpers/IPCHelpers';
import { STATUS, CHANNEL_EVENTS } from '../constants';

class ChannelsStore {
  channels: any[] = [];
  count: { online: number; offline: number } = { online: 0, offline: 0 };
  tab: string = STATUS.ONLINE;
  filter = '';

  constructor() {
    makeObservable(this, {
      channels: observable,
      tab: observable,
      count: observable,
      filter: observable,
      updateView: action,
      isOnline: computed,
    });
  }

  get isOnline() {
    return this.tab === STATUS.ONLINE;
  }

  changeFilter = (filter) => {
    this.filter = filter;
    this.updateView(CHANNEL_EVENTS.FILTER);
  };

  changeTab = (tab) => {
    this.tab = tab;
    this.updateView(CHANNEL_EVENTS.CHANGE_TAB);
  };

  updateView = async (type) => {
    const {
      channels,
      count,
    }: {
      channels: any[];
      count: { online: number; offline: number };
    } = await getChannels({ isLive: this.isOnline, filter: this.filter }, type);

    runInAction(() => {
      this.channels = channels;
      this.count = count;
    });
  };
}

export default ChannelsStore;
