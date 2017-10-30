import React, {Component} from 'react';

import styled from 'styled-components';
import Channel from '../../../Channel/Components/Channel/Channel'


const ChannelWrapper = ({channels, editChannel, handleClick, renameChannel, changeSetting, selectChannel, selected, playChannel, isUpdate, tab, filter, log}) => (

    <StyledWrapper isUpdate={isUpdate}>

        {channels.map((channel, index) => (
            <Channel
                log={log}
                visible={channel[tab.filter] === tab.filterValue}
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
    </StyledWrapper>
)

const StyledWrapper = styled.div`
    display: flex;
    color: black;
    flex-direction: column;
    padding-bottom: ${props => props.isUpdate ? 80 : 40}px;  
`


export default ChannelWrapper