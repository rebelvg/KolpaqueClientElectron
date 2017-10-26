import _ from 'lodash'

const FilterChannels = (channels, filter) => {
    filter = filter.trim();

    if (!filter) {
        return channels;
    }

    let filteredChannels = [];

    filteredChannels = _.filter(channels, (channelObj) => {
        return FilterChannel(channelObj, filter);
    });

    return filteredChannels;
};

const FilterChannel = (channelObj, filter) => {
    filter = filter.trim();

    if (!filter) {
        return false;
    }

    let filters = filter.split(/\s+/gi);

    let searchFilters = _.map(filters, (filter) => {
        return {
            pattern: filter,
            found: false
        };
    });

    _.forEach([channelObj.link, channelObj.name, channelObj.visibleName], (searchString) => {
        _.forEach(searchFilters, (filter) => {
            let regExp = new RegExp(filter.pattern, 'gi');

            if (regExp.test(searchString)) {
                filter.found = true;
            }
        });
    });

    return _.filter(searchFilters, 'found').length === filters.length;
};

export default FilterChannels
