import React, {Component} from 'react';

import styled from 'styled-components';
import Channel from '../Channel/Channel'

const ChannelWrapper = ({channels, handleClick, selectChannel, selected, playChannel}) => (

    <StyledWrapper>
        {channels.map((channel, index) => (
            <Channel
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
    padding-bottom: 30px;  
`


export default ChannelWrapper