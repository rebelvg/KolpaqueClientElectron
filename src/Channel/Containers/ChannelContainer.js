import React, {Component} from 'react';
import {connect} from 'react-redux';
import theme from '../../theme'
import {bindActionCreators} from 'redux';
import { withTheme } from 'styled-components'
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getOffline, getOnline, getUpdateStatus} from '../Reducers/ChannelReducers'
import {addChannel, sendInfo} from '../Actions/ChannelActions'
import ChannelWrapper from '../../Channel/Components/ChannelWrapper/ChannelWrapper'
import Channel from '../../Channel/Components/Channel/Channel'
import ChannelForm from '../../Channel/Forms/ChannelForm/ChannelForm'
import menuTemplate from '../Helpers/menu'

const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class ChannelContainer extends Component {
    constructor() {
        super()
        this.state = {
            selected: null,
            tab: 'online',
            editChannel: null,
        }
    }

    playChannel = (channelObj) => {
        ipcRenderer.send('channel_play', channelObj.id);
    }

    addChannel = (channel) => {
        this.props.addChannel(channel);
    }

    deleteChannel = (channelObj) => {
        ipcRenderer.send('channel_remove', channelObj.id);
    }

    changeSetting = (id, settingName, settingValue) => {
        ipcRenderer.send('channel_changeSetting', id, settingName, settingValue)
    }

    editChannel(channel) {
        this.setState({editChannel: channel})
    }

    renameChannel = (channel, id) => {
        if (!channel.id) {
            this.changeSetting(id, 'visibleName', channel)
        }
        else {
            this.changeSetting(channel.id, 'visibleName', channel.visibleName)
        }
        this.setState({editChannel: null})
    }

    openMenu = (channel) => {
        const menu = new Menu();
        const template = menuTemplate(channel, () => {
            this.editChannel(channel)
        });
        template.map((item) => menu.append(item))
        menu.popup(remote.getCurrentWindow())
    }

    selectChannel = (e, channel) => {
        const click = e.nativeEvent.which;
        const {selected} = this.state
        this.setState({selected: selected && channel.id === selected.id && click !== 3 ? '' : channel})
    }

    changeTab = (tab) => {
        this.setState({tab: tab})
    }

    sendInfo = (info) => {
        this.props.sendInfo(info)
    }

    render() {
        const {online, offline, update} = this.props;
        const {selected, tab, editChannel} = this.state;
        console.log(theme);
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
                        <Ionicon icon="ion-gear-b" color={theme.clientSecondary.color}/>
                    </SettingsIcon>
                </TabWrapper>
                <TabPanel active={tab === 'online'}>
                    <ChannelWrapper
                        isUpdate={!!update}
                        renameChannel={this.renameChannel}
                        editChannel={editChannel}
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
                        isUpdate={!!update}
                        renameChannel={this.renameChannel}
                        editChannel={editChannel}
                        selected={selected}
                        selectChannel={this.selectChannel}
                        changeSetting={this.changeSetting}
                        playChannel={this.playChannel}
                        handleClick={this.openMenu}
                        channels={offline}/>
                </TabPanel>

                {update &&
                <UpdateWrapper onClick={() => {
                    this.sendInfo(update)
                }}>
                    {update}
                </UpdateWrapper>}
                <StyledFooter>
                    <ChannelForm addChannel={this.addChannel}/>
                </StyledFooter>
            </StyledContainerWrapper>
        );
    }
}

const UpdateWrapper = styled.div`
    position: fixed;
    bottom: 28px;
    width: 100%;
    font-size: 14px;
    text-align: center;
    color: #9f2dff;
    text-decoration: underline;
    z-index: 0;
    padding: 5px 0px;
    border: 1px solid #979797;
    cursor: pointer;
    background-color:${theme.clientSecondary.bg};
`

const TabList = styled.div`
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    border-bottom: 1px solid lightgray;
    flex-direction: column;
    align-items: flex-end;
    width: 24px;
    position: relative;
    z-index: 1000;
`

const Tab = styled.div`
    user-select: none;
    display: flex;
    justify-content: center;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 12px;
    height: 105px;
    color: ${theme.tab.color};
    outline: 1px solid #979797;
    position: relative;
    cursor: pointer;
    align-items: center;
    box-sizing: content-box;
    ${props => props.active
    ? (`background-color: ${theme.tabSelected.bg}; width: 24px; z-index: 200`)
    : (`background-color: ${theme.tab.bg}; width: 21px;`)}
`

const TabPanel = styled.div`
    overflow-y: auto;
    width: 100%;
    display: ${props => props.active ? 'initial' : 'none'};
    max-height: 100vh;
    background-color: ${theme.clientSecondary.bg}
`


const StyledFooter = styled.div`
    background-color: ${theme.client.bg};
    color: white;
    position: fixed;
    bottom: 0px;
    width: 100%;
    z-index: 3;
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
     background-color: ${theme.client.bg};
     display:flex;
     justify-content: space-between;
     flex-direction: column;
     border-right: 1px solid #979797;
     position: relative;
     z-index: 2;
`

export default withTheme(connect(
    (state) => ({
        online: getOnline(state),
        offline: getOffline(state),
        update: getUpdateStatus(state)
    }),
    (dispatch) => bindActionCreators({
        addChannel,
        sendInfo
    }, dispatch)
)(ChannelContainer));
