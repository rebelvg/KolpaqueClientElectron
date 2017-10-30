import _ from 'lodash'

export const CompareChannels = (oldState, newState) => {
    if (oldState.length !== newState.length) {
        return false;
    }

    let res = true;

    _.forEach(oldState, (channel, index) => {
        if (!res) {
            return false;
        }

        _.forEach(channel, (channelValue, channelKey) => {
            if (newState[index][channelKey] !== channelValue) {
                res = false;
                return res;
            }
        });
    });

    return res;
};
