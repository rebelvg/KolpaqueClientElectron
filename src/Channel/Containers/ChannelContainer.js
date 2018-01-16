import React, { Component } from 'react';
import { connect } from 'react-redux';
import theme from '../../theme';
import { withTheme } from 'styled-components';
import Ionicon from 'react-ionicons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
    getChannels,
    getUpdateStatus,
    getLoading
} from '../Reducers/ChannelReducers';
import { sendInfo, sortChannels } from '../Actions/ChannelActions';
import ChannelForm from '../../Channel/Forms/ChannelForm/ChannelForm';
import menuTemplate from '../Helpers/menu';
import SearchForm from '../Forms/SearchForm/SearchForm';
import {getTab } from '../constants';
import Tabs from '../Components/Tabs/Tabs';
import { changeSetting } from '../Helpers/IPCHelpers';
import { FilterChannel } from '../Helpers/FilterChannels';
import Channel from '../../Channel/Components/Channel/Channel';

const { remote } = window.require('electron');
const { Menu } = remote;

@withTheme
@connect(
    state => ({
        channels: getChannels(state),
        update: getUpdateStatus(state),
        loading: getLoading(state)
    }),
    {
        sortChannels,
        sendInfo
    }
)
class ChannelContainer extends Component {
    constructor() {
        super();
        this.state = {
            selected: null,
            activeTab: 'online',
            editChannel: null,
            lastAction: new Date(),
            filter: ''
        };
    }

    editChannel = channel => this.setState({ editChannel: channel });

    openMenu = channel => {
        const menu = new Menu();
        const template = menuTemplate(channel, () => {
            this.editChannel(channel);
        });
        template.map(item => menu.append(item));
        menu.popup(remote.getCurrentWindow());
    };

    renameChannel = (name, id) => {
        changeSetting(id, 'visibleName', name);
        this.setState({ editChannel: null });
    };

    selectChannel = (button, channel) => {
        const { selected } = this.state;
        if (selected && channel.id === selected.id && button === 0) {
            this.setState({ selected: null });
        } else {
            if (button !== 1) {
                this.setState({ selected: channel });
            }
        }
    };

    changeTab = tab =>
        this.setState({
            activeTab: tab,
            lastAction: `changeTab${tab.value}${new Date()}`
        });

    sendInfo = info => this.props.sendInfo(info);

    handleChannelAction = (type, data) => {
        switch (type) {
            case 'RENAME': {
                this.renameChannel(...data);
                return;
            }
            case 'OPEN_MENU': {
                this.openMenu(...data);
                return;
            }
            case 'SELECT': {
                this.selectChannel(...data);
                return;
            }
        }
    };

    getCount = tab => {
        const { filter } = this.state;
        const { channels = [] } = this.props;
        const activeTab = getTab(tab);
        const data = channels.filter(
            channel =>
                channel[activeTab.filter] === activeTab.filterValue &&
                FilterChannel(channel, filter)
        );
        return data.length;
    };

    isTabActive = (active, tab) => active === tab;

    setFilter = value => this.setState({ filter: value });

    render() {
        const { channels, update} = this.props;
        const { selected, activeTab, editChannel, filter } = this.state;
        const currentTab = getTab(activeTab);
        return (
            <Wrapper>
                <SearchForm setFilter={this.setFilter} />
                <StyledContainerWrapper>
                    <TabWrapper>
                        <Tabs
                            active={activeTab}
                            isActive={this.isTabActive}
                            onChange={this.changeTab}
                            getCount={this.getCount}
                        />
                        <SettingsIcon onClick={() => {}} to="/about">
                            <Ionicon
                                icon="ion-gear-b"
                                color={theme.clientSecondary.color}
                            />
                        </SettingsIcon>
                    </TabWrapper>

                    <TabPanel>
                        <ChannelWrap isUpdate={update}>
                            {channels.map((channel, index) => (
                                <Channel
                                    visible={
                                        channel[currentTab.filter] ===
                                            currentTab.filterValue &&
                                        FilterChannel(channel, filter)
                                    }
                                    handleChannelAction={
                                        this.handleChannelAction
                                    }
                                    editMode={
                                        editChannel &&
                                        editChannel.id === channel.id
                                    }
                                    selected={
                                        selected &&
                                        selected.link === channel.link
                                    }
                                    key={channel.id}
                                    channel={channel}
                                />
                            ))}
                        </ChannelWrap>
                    </TabPanel>

                    {update && (
                        <UpdateWrapper
                            onClick={() => {
                                this.sendInfo(update);
                            }}
                        >
                            {update}
                        </UpdateWrapper>
                    )}

                    <StyledFooter>
                        <ChannelForm />
                    </StyledFooter>
                </StyledContainerWrapper>
            </Wrapper>
        );
    }
}
const ChannelWrap = styled.div`
    display: flex;
    color: black;
    flex-direction: column;
    padding-bottom: ${({ isUpdate }) => (isUpdate ? 80 : 50)}px;
`;

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
    border: 1px solid ${theme.outline};
    cursor: pointer;
    background-color: ${theme.clientSecondary.bg};
`;

const Wrapper = styled.div`
    width: 100%;
`;

const TabPanel = styled.div`
    overflow-y: auto;
    width: 100%;
    display: block;
    max-height: 100vh;
    background-color: ${theme.clientSecondary.bg};
`;

const StyledFooter = styled.div`
    background-color: ${theme.client.bg};
    color: white;
    position: fixed;
    bottom: 0px;
    width: 100%;
    z-index: 3;
`;

const SettingsIcon = styled(Link)`
    display: flex;
    justify-content: center;
    padding-bottom: 51px;
`;

const StyledContainerWrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
`;

const TabWrapper = styled.div`
    height: 100%;
    background-color: ${theme.client.bg};
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    border-right: 1px solid ${theme.outline};
    position: relative;
    z-index: 2;
`;

export default ChannelContainer