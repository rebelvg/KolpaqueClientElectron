import _ from 'lodash'

const SortChannels = (channels, sort, reverse = false) => {
    let sortedChannels = [];

    switch (sort) {
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

    if (reverse) {
        sortedChannels.reverse();
    }

    console.log(sortedChannels);

    return sortedChannels;
};

export default SortChannels
