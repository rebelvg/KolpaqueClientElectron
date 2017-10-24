import React, {Component} from 'react';
import {connect} from 'react-redux';
import theme from '../../theme'
import {bindActionCreators} from 'redux';
import {withTheme} from 'styled-components'
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getChannels, getUpdateStatus} from '../Reducers/ChannelReducers'
import {sendInfo, sortChannels} from '../Actions/ChannelActions'
import ChannelWrapper from '../../Channel/Components/ChannelWrapper/ChannelWrapper'
import Channel from '../../Channel/Components/Channel/Channel'
import ChannelForm from '../../Channel/Forms/ChannelForm/ChannelForm'
import menuTemplate from '../Helpers/menu'
import FilterChannels from '../Helpers/FilterChannels';
import {changeSetting} from '../Helpers/IPCHelpers'

const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class ChannelContainer extends Component {
    constructor() {
        super()
        this.state = {
            selected: null,
            tab: 'online',
            editChannel: null,
            filter: '',
        }
    }

    filterInput = {value: ''}

    editChannel(channel) {
        this.setState({editChannel: channel})
    }

    openMenu = (channel) => {
        const menu = new Menu();
        const template = menuTemplate(channel, () => {
            this.editChannel(channel)
        });
        console.log(channel)
        template.map((item) => menu.append(item))
        menu.popup(remote.getCurrentWindow())
    }

    renameChannel = (channel, id) => {
        if (!channel.id) {
            changeSetting(id, 'visibleName', channel)
        }
        else {
            changeSetting(channel.id, 'visibleName', channel.visibleName)
        }
        this.setState({editChannel: null})
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

    getChannelsByLive = (isLive) => {
        const {channels} = this.props
        return channels.filter((channel) => channel.isLive === isLive)
    }

    setFilter = (v) => {
        this.setState({
            filter: v
        })
    }

    render() {
        const {channels, update} = this.props;
        const {selected, tab, editChannel, filter} = this.state;

        return (
            <Wrapper>
                <InputWrapper>
                    <input name="filter" type="text" ref={(ref) => {
                        this.filterInput = ref
                    }} onChange={(e, v) => {
                        this.setFilter(v)
                    }}/>
                </InputWrapper>

                <StyledContainerWrapper>
                    <TabWrapper>
                        <TabList>
                            <Tab active={tab === 'online'} onClick={() => this.changeTab('online')}>
                                Online ({this.getChannelsByLive(true).length})
                            </Tab>
                            <Tab active={tab === 'offline'} onClick={() => this.changeTab('offline')}>
                                Offline ({this.getChannelsByLive(false).length})
                            </Tab>
                            <div onClick={() => this.props.sortChannels()}>
                                <Ionicon icon="ion-ios-loop-strong"/>
                            </div>
                        </TabList>
                        <SettingsIcon onClick={() => {
                        }} to="/about">
                            <Ionicon icon="ion-gear-b" color={theme.clientSecondary.color}/>
                        </SettingsIcon>
                    </TabWrapper>
                    <TabPanel active={tab === 'online'}>
                        <ChannelWrapper
                            isUpdate={!!update}
                            editChannel={editChannel}
                            selected={selected}
                            selectChannel={this.selectChannel}
                            handleClick={this.openMenu}
                            renameChannel={this.renameChannel}
                            channels={channels.filter((channel) => !!channel.isLive)}
                        />
                    </TabPanel>
                    <TabPanel active={tab === 'offline'}>
                        <ChannelWrapper
                            isUpdate={!!update}
                            editChannel={editChannel}
                            selected={selected}
                            selectChannel={this.selectChannel}
                            renameChannel={this.renameChannel}
                            handleClick={this.openMenu}
                            channels={channels.filter((channel) => !channel.isLive)}/>
                    </TabPanel>

                    {update &&
                    <UpdateWrapper onClick={() => {
                        this.sendInfo(update)
                    }}>
                        {update}
                    </UpdateWrapper>}
                    <StyledFooter>
                        <ChannelForm/>
                    </StyledFooter>
                </StyledContainerWrapper>
            </Wrapper>
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

const Wrapper = styled.div`
        width: 100%;
`

const InputWrapper = styled.div`
    height:20px;
    & > input {
        width: 100%;
        border: none;
        height:20px;
        font-size:12px;  
        border-top: 1px solid #979797;
        padding: 0 10px;
    }
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
    margin-top: 1px;
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
    padding-bottom: 55px;
`

const StyledContainerWrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
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
        channels: getChannels(state),
        update: getUpdateStatus(state)
    }),
    (dispatch) => bindActionCreators({
        sortChannels,
        sendInfo
    }, dispatch)
)(ChannelContainer));
