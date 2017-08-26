import React from 'react';

import styled from 'styled-components';
import Channel from '../Channel/Channel'

const ChannelWrapper = ({channels = []}) => (
    <StyledWrapper>
        {channels.map((channel, index) => (
            <Channel key={index} channel={channel}/>
        ))}
    </StyledWrapper>
);

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column
`

export default ChannelWrapper;
