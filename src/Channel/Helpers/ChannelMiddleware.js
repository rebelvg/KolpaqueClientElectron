import _ from 'lodash'
import {FilterChannel} from './FilterChannels'
import SortChannels from './SortChannels'
import {getTab, visibleByTab} from 'src/Channel/constants'
const {ipcRenderer} = window.require('electron');

const channelMiddleWare = (options) => {
    const {tab, filter} = options;
    const activeTab = getTab(tab);
    const nextChannels = _.map(channels, (channel) =>
        ({
            ...channel,
            visible: FilterChannel(channel, filter) && visibleByTab(channel, activeTab)
        })
    );
    return SortChannels(nextChannels, sort, isReversed)
}
export default channelMiddleWare