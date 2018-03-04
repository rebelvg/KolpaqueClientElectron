import React, {PureComponent} from 'react'
import styled, {withTheme} from 'styled-components'
import {connect} from 'react-redux';
import Channel from 'src/Channel/Components/Channel'
import {
    getChannelsList,
    getUpdate,
} from 'src/redux/channel'
import {
    changeSetting,
    openChannelMenu
} from 'src/Channel/Helpers/IPCHelpers'
import {getShowTooltips} from 'src/redux/settings'
import VirtualList from 'react-tiny-virtual-list'

@withTheme
@connect(
    state => ({
        channels: getChannelsList(state),
        update: getUpdate(state),
        showTooltips: getShowTooltips(state),
    }),
)
class Channels extends PureComponent {
    constructor() {
        super()
        this.state = {
            selected: null,
            edit: null,
        };
    }

    edit = channel => {
        this.setState({edit: channel})
    };

    openMenu = channel => {
        openChannelMenu(channel, () => this.edit(channel))
    }

    renameChannel = (name, id) => {
        changeSetting(id, 'visibleName', name);
        this.setState({edit: null});
    };

    selectChannel = (button, channel) => {
        const {selected} = this.state;
        if (selected && channel.id === selected.id && button === 0) {
            this.setState({selected: null});
        } else {
            if (button !== 1) {
                this.setState({selected: channel});
            }
        }
    };

    handleAction = (type, data) => {
        const actions = {
            'RENAME': () => this.renameChannel(...data),
            'OPEN_MENU': () => this.openMenu(...data),
            'SELECT': () => this.selectChannel(...data)
        }

        if (actions[type]) {
            actions[type]()
        }

    };

    render() {
        const {channels, update, showTooltips} = this.props;
        const {edit, selected} = this.state;
        return (
            <ChannelWrap isUpdate={update}>
                <VirtualList
                    width='100%'
                    height={600}
                    overscanCount={20}
                    itemCount={channels.length}
                    itemSize={25} // Also supports variable heights (array or function getter)
                    renderItem={({index, style}) =>
                        <div key={channels[index].id} style={style}>
                            <Channel
                                style={style}
                                handleAction={this.handleAction}
                                showTooltips={!!showTooltips}
                                editMode={
                                    edit &&
                                    edit.id === channels[index].id
                                }
                                selected={
                                    selected &&
                                    selected.link === channels[index].link
                                }
                                channel={channels[index]}
                            />
                        </div>
                    }
                />
            </ChannelWrap>
        )
    }
}

export default Channels

const ChannelWrap = styled.div`
    display: flex;
    color: black;
    height: 100%;
    flex-direction: column;
    padding-bottom: ${({isUpdate}) => (isUpdate ? 25 : 0)}px;
    
`;