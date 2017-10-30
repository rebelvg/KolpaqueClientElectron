import React from 'react';
import Icon from 'react-icons-kit';
import {refresh} from 'react-icons-kit/fa/refresh';
import {twitch} from 'react-icons-kit/fa/twitch';
import {eye} from 'react-icons-kit/fa/eye';
import {youtubePlay} from 'react-icons-kit/fa/youtubePlay';
import styled from 'styled-components'

const ICONS = {
    'twitch': {
        asset: twitch,
        type: 'component',
        color: "#6441a5"
    },
    'klpq-vps': {
        asset: "./static/icons/klpq_vps.svg",
        type: 'image',
        color: null
    },
    'klpq-main': {
        asset: "./static/icons/klpq_main.svg",
        type: 'image',
        color: null
    },
    'youtube-user': {
        type: 'component',
        asset: youtubePlay,
        color: "#E62117"
    },
    'youtube-channel': {
        type: 'component',
        asset: youtubePlay,
        color: "#E62117"
    },
    'default': {
        asset: eye,
        component: 'darkgreen'
    }
}


export const renderIcon = (serviceName) => {
    const service = ICONS[serviceName] ? ICONS[serviceName] : ICONS['default'];
    if (service.type === 'image') {
        return (
            <IconImage>
                <img src={service.asset}/>
            </IconImage>
        )
    }
    else {
        return <StyledIcon icon={service.asset} color={service.color}/>
    }
};

const getAutoRestartColor = (autoRestart, onAutoRestart) => {
    if (onAutoRestart) {
        return '#119400'
    } else {
        return autoRestart ? 'black' : '#979797'
    }
}

export const renderAutoRestart = ({id, autoRestart, onAutoRestart, isLive}, changeSetting, log) => (
    <IconWrapper onClick={(e) => {
        e.preventDefault();
        log('autoRestart', id)
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

export const renderAutoStart = ({autoStart, id}, changeSetting, log) => (
    <IconWrapper onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        log('autoStart', id)
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

const IconImage = styled.div`
    width: 16px; 
    height: 16px;
    & > img {
        width: 100%;
    }
`

const StyledIcon = styled(Icon)`
    width: 16px; 
    height: 16px;
    color: ${props => !!props.color ? props.color : 'darkgreen'}
`

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 20px;
    margin-right: 4px;
`