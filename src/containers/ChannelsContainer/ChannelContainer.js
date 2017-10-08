import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getOffline, getOnline} from '../../redux/reducers/channels'
import './style.css';
import ChannelWrapper from '../../components/Channels/ChannelWrapper/ChannelWrapper'
import Channel from '../../components/Channels/Channel/Channel'
import ChannelForm from '../../components/Channels/ChannelForm/ChannelForm'
//import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import menuTemplate from '../../helper/menu'

const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class ChannelContainer extends Component {
    constructor() {
        super()
        this.state = {
            selected: null,
            tab: 'online'
        }
    }

    playChannel = (channelObj) => {
        ipcRenderer.send('channel_play', channelObj.id);
    }

    addChannel = ({channel}) => {
        ipcRenderer.send('channel_add', channel);
    }

    deleteChannel = (channelObj) => {
        ipcRenderer.send('channel_remove', channelObj.id);
    }

    changeSetting = (id, settingName, settingValue) => {
        console.log('nigga')
        ipcRenderer.send('channel_changeSetting', id, settingName, settingValue)
    }

    openMenu = (channel) => {
        const menu = new Menu();
        const template = menuTemplate(channel);
        template.map((item) => menu.append(item))
        menu.popup(remote.getCurrentWindow())
    }

    selectChannel = (channel) => {
        this.setState({selected: channel})
    }

    changeTab = (tab) => {
        this.setState({tab: tab})
    }

    render() {
        const {online, offline} = this.props;
        const {selected, tab} = this.state;
        return (
            <StyledContainerWrapper>

                <TabWrapper>
                    <TabList>
                        <Tab active={tab === 'online'} onClick={() => this.changeTab('online')}>
                            Online ({online.length})
                        </Tab>
                        <Tab active={tab === 'offline'} onClick={() => this.changeTab('offline')}>
                            Offline ({offline.length})
                        </Tab>
                    </TabList>
                    <SettingsIcon onClick={() => {
                        console.log('click')
                    }} to="/about">
                        <Ionicon icon="ion-gear-b" color="black"/>
                    </SettingsIcon>
                </TabWrapper>
                <TabPanel active={tab === 'online'}>
                    <ChannelWrapper
                        selected={selected}
                        selectChannel={this.selectChannel}
                        playChannel={this.playChannel}
                        changeSetting={this.changeSetting}
                        handleClick={this.openMenu}
                        channels={online}
                    />
                </TabPanel>
                <TabPanel active={tab === 'offline'}>
                    <ChannelWrapper
                        selected={selected}
                        selectChannel={this.selectChannel}
                        changeSetting={this.changeSetting}
                        playChannel={this.playChannel}
                        handleClick={this.openMenu}
                        channels={offline}/>
                </TabPanel>


                <StyledFooter className="fixed-bottom">
                    <ChannelForm onSubmit={this.addChannel}/>
                </StyledFooter>
            </StyledContainerWrapper>
        );
    }
}

const TabList = styled.div`
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    border-bottom: 1px solid lightgray;
    flex-direction: column;
    align-items: flex-end;
    width: 24px;
`

const Tab = styled.div`
    user-select: none;
    display: flex;
    justify-content: center;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 12px;
    background-color: white;
    height: 105px;
    outline: 1px solid #969696;
    width: 21px;
    cursor: pointer;
    align-items: center;
    box-sizing: content-box;
    ${props => props.active && ("box-shadow: inset -1px 0px 0px 0px #119400; border-right: 2px solid #119400;")}
`

const TabPanel = styled.div`
    overflow-y: auto;
    width: 100%;
    display: ${props => props.active ? 'initial' : 'none'};
    max-height: 100vh;
`


const StyledFooter = styled.div`
    background-color: #D7D7D7;
    color: white;
`

const SettingsIcon = styled(Link)`
    display: flex;
    justify-content: center;
    padding-bottom: 30px;
`

const StyledContainerWrapper = styled.div`
    display: flex;
    width: 100%;
`

const StyledChannel = styled(Channel)`
    background-color: yellow
    color: white;
`

const TabWrapper = styled.div`
     height:100%;
     background-color: #D7D7D7;
     display:flex;
     justify-content: space-between;
     flex-direction: column;
`

export default connect(
    (state) => ({
        online: getOnline(state),
        offline: getOffline(state)
    }),
    (dispatch) => bindActionCreators({}, dispatch)
)(ChannelContainer);
