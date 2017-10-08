import React from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'

const getAutoRestartColor = (autoRestart, onAutoRestart) => {
    if (onAutoRestart) {
        return '#119400'
    } else {
        return autoRestart ? 'black' : '#979797'
    }
}

const renderIcon = (service) => {
    if (service === 'twitch') {
        return <Ionicon fontSize="16px" color="#6441a5" icon="ion-social-twitch-outline"/>
    }
    else {
        return <Ionicon icon="ion-eye" fontSize="16px" color="dark-green"/>
    }
};

const renderAutoRestart = ({id, autoRestart, onAutoRestart, isLive}, changeSetting) => (
    <IconWrapper onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAutoRestart
            ? changeSetting(id, 'onAutoRestart', !onAutoRestart)
            : changeSetting(id, 'autoRestart', !autoRestart)
    }
    }>
        <Ionicon icon="ion-android-arrow-dropleft-circle" style={{height: "25px"}}
                 color={getAutoRestartColor(autoRestart, onAutoRestart)}/>
    </IconWrapper>
)

const renderAutoStart = ({autoStart, id}, changeSetting) => (
    <IconWrapper onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        changeSetting(id, 'autoStart', !autoStart)
    }
    }>
        <Ionicon icon="ion-eye" style={{height: "25px"}}
                 color={autoStart ? "black" : "#979797"}/>
    </IconWrapper>
)

const Channel = ({channel, pinned, handleClick, selected, selectChannel, playChannel, changeSetting}) => (
    <ChannelWrapper

        onMouseDown={() => selectChannel(channel)}
        selected={selected}
        onContextMenu={() => handleClick(channel)}
        pinned={pinned}>
        <ChannelData onDoubleClick={() => playChannel(channel)}>
            <StyledIcon> {renderIcon(!!channel.service && channel.service)} </StyledIcon>
            <StyledName>{channel.visibleName || channel.link} </StyledName>
        </ChannelData>
        <Icons>
            {renderAutoRestart(channel, changeSetting)}
            {renderAutoStart(channel, changeSetting)}
        </Icons>
    </ChannelWrapper>
);


const ChannelWrapper = styled.div`
    display: flex;
    user-select: none;
    cursor:pointer;
    align-items: center;
    padding: 2px 0px;
    font-weight: bold;
    flex-direction: row;
    font-size: 14px;
    height:25px;
    background-color:  ${props => !props.selected ? 'initial' : '#ece8e8'};
    border-top: 1px solid #969696;
`;
const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 25px;
    margin-right: 4px;
`
const Icons = styled.div`
    display: flex;
    height: 25px;
    flex-direction: row;
`
const ChannelData = styled.div`
    flex-grow: 2;
    display: flex;
    flex-direction: row;
`

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
           display: flex;
    align-items: center;
`;

export default Channel;