import React, {Component} from 'react';

import styled from 'styled-components';
import Channel from '../../../Channel/Components/Channel/Channel'

const ChannelWrapper = ({channels, handleClick,changeSetting,  selectChannel, selected, playChannel}) => (

    <StyledWrapper>
        {channels.map((channel, index) => (
            <Channel
                changeSetting = {changeSetting}
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