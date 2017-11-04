import React, {PureComponent} from 'react';

import styled from 'styled-components';
import Channel from '../../../Channel/Components/Channel/Channel'
import {FilterChannel} from '../../Helpers/FilterChannels'

class ChannelWrapper extends PureComponent {
    constructor() {
        super()
    }

    render() {
        const {channels, editChannel, handleClick, renameChannel, changeSetting, selectChannel, selected, playChannel, isUpdate, tab, filter} = this.props;
        return (
            <StyledWrapper isUpdate={isUpdate}>
                {channels.map((channel, index) => (
                    <Channel
                        visible={channel[tab.filter] === tab.filterValue && FilterChannel(channel, filter)}
                        filter={filter}
                        renameChannel={renameChannel}
                        editMode={editChannel && editChannel.id === channel.id}
                        changeSetting={changeSetting}
                        playChannel={playChannel}
                        selectChannel={selectChannel}
                        selected={selected && selected.link === channel.link}
                        handleClick={handleClick}
                        key={channel.id} channel={channel}/>
                ))}
            </StyledWrapper>)
    }
}


const StyledWrapper = styled.div`
    display: flex;
    color: black;
    flex-direction: column;
    padding-bottom: ${({isUpdate}) => isUpdate ? 80 : 40}px;  
`


export default ChannelWrapper