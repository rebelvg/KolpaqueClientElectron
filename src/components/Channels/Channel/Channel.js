import React from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'

const renderIcon = (service) => {
    if (service === 'twitch') {
        return <Ionicon fontSize="24px" icon="ion-social-twitch-outline"/>
    }
    else {
        return <Ionicon icon="ion-eye" color="dark-green"/>
    }
};

const Channel = ({channel, pinned}) => (
    <StyledChannelWrap pinned={pinned}>
        <StyledIcon > {renderIcon(channel.service)} </StyledIcon>

        <StyledName>{channel.name || channel.link} </StyledName>

    </StyledChannelWrap>
);

const StyledChannelWrap = styled.div`
    display: flex;
    background-color: ${props => props.pinned ? 'yellow' : 'transparent'};
    align-items: center;
`;

const StyledIcon = styled.div`
    margin-right: 10px;
    display: flex;
    align-items: center;
    margin-left: 5px;
`;

const StyledName = styled.div`
    flex-grow: 2;
`;


export default Channel;