import React from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'

const renderIcon = (service) => {
    if (service === 'twitch') {
        return <Ionicon fontSize="16px" color="#6441a5" icon="ion-social-twitch-outline"/>
    }
    else {
        return <Ionicon icon="ion-eye" fontSize="16px" color="dark-green"/>
    }
};

const renderAutoRestart = ({autoRestart, isLive}) => (
    <Ionicon icon="ion-ios-loop-strong" color="#242424"
    />
)

const renderAutoStart = ({autoStart}) => (
    <Ionicon icon="ion-eye" color="dark-green"/>
)

const Channel = ({channel, pinned, handleClick, selected, selectChannel, playChannel}) => (
    <StyledChannelWrap
        onDoubleClick={() => playChannel(channel)}
        onMouseDown={() => selectChannel(channel)}
        selected={selected}
        onContextMenu={() => handleClick(channel)}
        pinned={pinned}>
        <StyledIcon> {renderIcon(!!channel.service && channel.service)} </StyledIcon>
        <StyledName>{channel.visibleName || channel.link} </StyledName>
        {renderAutoRestart(channel)}
        {renderAutoStart(channel)}
    </StyledChannelWrap>
);

const StyledChannelWrap = styled.div`
    display: flex;
    user-select: none;
    background-color: ${props => props.selected ? '#e8e8e8' : 'transparent'};
    cursor:pointer;
    align-items: center;
    padding: 2px 0px;
    font-weight: bold;
    font-size: 14px;
    height:25px;
    border-top: 1px solid #969696;
`;

const StyledIcon = styled.div`
    margin-right: 5px;
    display: flex;
    align-items: center;
    margin-left: 5px;
    height:25px
`;

const StyledName = styled.div`
    flex-grow: 2;
       height:25px;
`;

export default Channel;