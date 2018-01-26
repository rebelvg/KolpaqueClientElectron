import _ from 'lodash'

const SortChannels = (channels, sortType, isReversed = false) => {
    let sortedChannels = [];

    switch (sortType) {
        case 'lastAdded': {
            sortedChannels = channels;
            break;
        }
        case 'lastUpdated': {
            sortedChannels = _.sortBy(channels, ['lastUpdated']);
            break;
        }
        case 'service_visibleName': {
            sortedChannels = _.sortBy(channels, ['service', 'visibleName']);
            break;
        }
        case 'visibleName': {
            sortedChannels = _.sortBy(channels, ['visibleName']);
            break;
        }
        default: {
            sortedChannels = channels;
        }
    }

    if (isReversed) {
        sortedChannels.reverse();
    }

    sortedChannels = _.sortBy(sortedChannels, [(channel) => !channel.isPinned]);

    return sortedChannels;
};

export default SortChannels;
