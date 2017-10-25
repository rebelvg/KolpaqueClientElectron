import React, {Component} from 'react';
import {connect} from 'react-redux';
import theme from '../../theme'
import {bindActionCreators} from 'redux';
import {withTheme} from 'styled-components'
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getChannels, getUpdateStatus, getLoading} from '../Reducers/ChannelReducers'
import {sendInfo, sortChannels} from '../Actions/ChannelActions'
import ChannelWrapper from '../../Channel/Components/ChannelWrapper/ChannelWrapper'
import ChannelForm from '../../Channel/Forms/ChannelForm/ChannelForm'
import menuTemplate from '../Helpers/menu'
import {TABS} from '../constants';
import Tabs from '../Components/Tabs/Tabs'
import FilterChannels from '../Helpers/FilterChannels';
import {changeSetting} from '../Helpers/IPCHelpers'

const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class ChannelContainer extends Component {
    constructor() {
        super()
        this.state = {
            selected: null,
            activeTab: 'online',
            editChannel: null,
            filter: '',
        }
    }

    filterInput = {value: ''}

    editChannel = (channel) => this.setState({editChannel: channel})

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

    changeTab = (tab) => this.setState({activeTab: tab})
    sendInfo = (info) => this.props.sendInfo(info)

    getChannelsByTab = (tab, count = false) => {
        const {channels = []} = this.props
        const activeTab = TABS.find((t) => t.value === tab);
        const data = channels.filter((channel) => channel[activeTab.filter] === activeTab.filterValue)
        if (!count) {
            return data
        }
        else {
            return data.length
        }
    }

    isTabActive = (active, tab) => active === tab

    setFilter = (v) => this.setState({filter: v})

    render() {
        const {channels, update, loading} = this.props;
        const {selected, activeTab, editChannel, filter} = this.state;
        return (
            <Wrapper>


                <StyledContainerWrapper>
                    <TabWrapper>
                        <Tabs
                            active={activeTab}
                            isActive={this.isTabActive}
                            onChange={this.changeTab}
                            getCount={this.getChannelsByTab}
                        />
                        <SettingsIcon onClick={() => {
                        }} to="/about">
                            <Ionicon icon="ion-gear-b" color={theme.clientSecondary.color}/>
                        </SettingsIcon>
                    </TabWrapper>
                    <TabPanel>
                        <ChannelWrapper
                            isUpdate={!!update}
                            editChannel={editChannel}
                            selected={selected}
                            selectChannel={this.selectChannel}
                            handleClick={this.openMenu}
                            renameChannel={this.renameChannel}
                            channels={this.getChannelsByTab(activeTab)}
                        />
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


const TabPanel = styled.div`
    overflow-y: auto;
    width: 100%;
    display: block;
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
        update: getUpdateStatus(state),
        loading: getLoading(state)
    }),
    (dispatch) => bindActionCreators({
        sortChannels,
        sendInfo
    }, dispatch)
)(ChannelContainer));
