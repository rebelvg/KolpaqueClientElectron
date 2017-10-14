import React from 'react';
import Icon from 'react-icons-kit';
import {refresh} from 'react-icons-kit/fa/refresh';
import {twitch} from 'react-icons-kit/fa/twitch';
import styled from 'styled-components'

export const renderIcon = (service) => {
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

const getAutoRestartColor = (autoRestart, onAutoRestart) => {
    if (onAutoRestart) {
        return '#119400'
    } else {
        return autoRestart ? 'black' : '#979797'
    }
}

export const renderAutoRestart = ({id, autoRestart, onAutoRestart, isLive}, changeSetting) => (
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

export const renderAutoStart = ({autoStart, id}, changeSetting) => (
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


const IconBase = styled(Icon)`
    width: 12px;
    height: 12px
`

const Twitch = styled(Icon)`
    color: #6441a5
`

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 25px;
    margin-right: 4px;
`