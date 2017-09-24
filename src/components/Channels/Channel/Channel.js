import React from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'

const renderIcon = (service) => {
    if (service === 'twitch') {
        return <Ionicon fontSize="24px" color="#6441a5" icon="ion-social-twitch-outline"/>
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
    padding: 2px 0px;
    font-weight: bold;
    font-size: 14px;
    border-top: 1px solid #969696;
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