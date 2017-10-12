import React from 'react';
import Icon from 'react-icons-kit';
import {refresh} from 'react-icons-kit/fa/refresh';
import {twitch} from 'react-icons-kit/fa/twitch';
import {lowVision} from 'react-icons-kit/fa/lowVision';
import {eye} from 'react-icons-kit/fa/eye';
import styled from 'styled-components'

const getAutoRestartColor = (autoRestart, onAutoRestart) => {
    if (onAutoRestart) {
        return '#119400'
    } else {
        return autoRestart ? 'black' : '#979797'
    }
}

const renderIcon = (service) => {
    switch (service) {
        case 'twitch':
            return <Twitch fontSize="12px" icon={twitch}/>
        case 'klpq-vps':
            return <img width="16px" height="16px"
                        src="./static/icons/klpq_vps.svg"/>
        default:
            return <img width="16px" height="16px"
                        src="./static/icons/klpq_main.svg"/>
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

        <IconBase icon={refresh}
                  style={{color: getAutoRestartColor(autoRestart, onAutoRestart)}}/>

    </IconWrapper>
)

const renderAutoStart = ({autoStart, id}, changeSetting) => (
    <IconWrapper onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        changeSetting(id, 'autoStart', !autoStart)
    }
    }>

        <img width="12px" height="12px"
             src={autoStart ? "./static/icons/autostart_on.svg" : "./static/icons/autostart_off.svg" }/>
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
    flex-direction: row-reverse;
`
const ChannelData = styled.div`
    flex-grow: 2;
    display: flex;
    flex-direction: row;
`

const IconBase = styled(Icon)`
    width: 12px;
    height: 12px
`

const KLPQ = styled(Icon)`
    color: darkgreen
`
const Twitch = styled(Icon)`
    color: #6441a5
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