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
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import menuTemplate from '../../helper/menu'

const {remote, ipcRenderer} = window.require('electron');
const {Menu, MenuItem} = remote;

export class ChannelContainer extends Component {
    constructor() {
        super()
        this.state = {
            selected: null,
        }
    }

    playChannel = (channelObj) => {
        ipcRenderer.send('channel_play', channelObj.id);
    }

    addChannel = (channelLink) => {
        ipcRenderer.send('channel_add', channelLink);
    }

    deleteChannel = (channelObj) => {
        ipcRenderer.send('channel_remove', channelObj.id);
    }

    openMenu = (channel) => {
        const menu = new Menu();
        const template = menuTemplate(channel, this.deleteChannel);
        template.map((item) => menu.append(item))
        menu.popup(remote.getCurrentWindow())
    }

    selectChannel = (channel) => {
        this.setState({selected: channel})
    }

    componentWillMount() {

    }

    componentDidMount() {

    }

    render() {
        const {online, offline} = this.props;
        const {selected} = this.state;
        return (
            <StyledContainerWrapper>
                <Tabs>
                    <TabWrapper>
                        <TabList className="tabs">
                            <Tab className='tab' selectedClassName="active">
                                Online ({online.length})
                            </Tab>
                            <Tab className='tab' selectedClassName="active">
                                Offline ({offline.length})
                            </Tab>
                        </TabList>
                        <SettingsIcon onClick={() => {
                            console.log('click')
                        }} to="/about">
                            <Ionicon icon="ion-gear-b" color="black"/>
                        </SettingsIcon>
                    </TabWrapper>
                    <TabPanel className='tab-panel'>
                        <ChannelWrapper
                            selected={selected}
                            selectChannel={this.selectChannel}
                            playChannel={this.playChannel}
                            handleClick={this.openMenu}
                            channels={online}
                        />
                    </TabPanel>
                    <TabPanel className='tab-panel'>
                        <ChannelWrapper
                            selected={selected}
                            selectChannel={this.selectChannel}
                            playChannel={this.playChannel}
                            handleClick={this.openMenu}
                            channels={offline}/>
                    </TabPanel>
                </Tabs>

                <StyledFooter className="fixed-bottom">
                    <ChannelForm onSubmit={this.addChannel}/>
                </StyledFooter>
            </StyledContainerWrapper>
        );
    }
}

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
