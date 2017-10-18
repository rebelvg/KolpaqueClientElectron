import React, {Component} from 'react';

import styled from 'styled-components';
import Channel from '../../../Channel/Components/Channel/Channel'

const ChannelWrapper = ({channels, editChannel, handleClick, renameChannel, changeSetting, selectChannel, selected, playChannel, update}) => (

    <StyledWrapper isUpdate={!!update}>
        {channels.map((channel, index) => (
            <Channel
                renameChannel={renameChannel}
                editMode={editChannel && editChannel.id === channel.id}
                changeSetting={changeSetting}
                playChannel={playChannel}
                selectChannel={selectChannel}
                selected={selected && selected.link === channel.link}
                handleClick={handleClick}
                key={index} channel={channel}/>
        ))}
    </StyledWrapper>
)


const StyledWrapper = styled.div`
    display: flex;
    color: black;
    flex-direction: column;
    padding-bottom: ${props => !!props.isUpdate ? 30 : 60}px;  
`


export default ChannelWrapper