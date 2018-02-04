import React, {Component} from 'react';
import {connect} from 'react-redux';
import Ionicon from 'react-ionicons';
import Icon from 'react-icons-kit';
import {loadC} from 'react-icons-kit/ionicons/loadC';
import {Link} from 'react-router-dom';
import styled, {withTheme, keyframes} from 'styled-components';
import ChannelForm from '../Forms/ChannelForm';
import menuTemplate from '../Helpers/menu';
import SearchForm from '../Forms/SearchForm/SearchForm';
import {getTab} from '../constants';
import Tabs from '../Components/Tabs/Tabs';
import {changeSetting, addChannel} from '../Helpers/IPCHelpers';
import Channel from '../../Channel/Components/Channel/Channel';
import {Form} from 'react-final-form'
import {
    getCompleteChannels,
    getFullCount,
    setSort,
    getUpdate,
    setFilter,
    getLoading,
    getLoaded,
    sendInfo
} from '../../redux/channel'


const {remote} = window.require('electron');
const {Menu} = remote;

@withTheme
@connect(
    state => ({
        channels: getCompleteChannels(state),
        update: getUpdate(state),
        loading: getLoading(state),
        loaded: getLoaded(state),
        count: getFullCount(state)
    }),
    {
        sendInfo,
        setSort,
        setFilter,
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

    editChannel = channel => this.setState({editChannel: channel});

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
        this.setState({editChannel: null});
    };

    selectChannel = (button, channel) => {
        const {selected} = this.state;
        if (selected && channel.id === selected.id && button === 0) {
            this.setState({selected: null});
        } else {
            if (button !== 1) {
                this.setState({selected: channel});
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

    addChannelForm = ({channel}) => {
        if (channel) {
            addChannel(channel)
        }
    }

    getCount = tab => {
        const {count} = this.props;
        const activeTab = getTab(tab);
        return count[activeTab.value] || 0;
    };

    isTabActive = (active, tab) => active === tab;

    setFilter = value => {
        const filter = value.filter ? value.filter : '';
        this.props.setFilter(filter)
    }


    render() {
        const {channels, update, theme, loaded} = this.props;
        const {selected, activeTab, editChannel} = this.state;
        const currentTab = getTab(activeTab);

        if (loaded) {
            return (
                <LoadingWrapper>
                    <LoadingIcon icon={loadC}/>
                    <LoadingText> Initializing client </LoadingText>
                </LoadingWrapper>
            )
        }

        return (
            <Wrapper>
                <ChannelSearchForm
                    onSubmit={this.setFilter}
                    save={this.setFilter}
                    render={props => <SearchForm {...props}/>}
                    subscription={{}}
                />

                <StyledContainerWrapper>
                    <TabWrapper>
                        <Tabs
                            active={activeTab}
                            isActive={this.isTabActive}
                            onChange={this.changeTab}
                            getCount={this.getCount}
                        />
                        <SettingsIcon onClick={() => {
                        }} to="/about">
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
                                        currentTab.filterValue
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
                        <ChannelAddForm onSubmit={this.addChannelForm}
                                        render={props => <ChannelForm {...props}/>}
                        />
                    </StyledFooter>
                </StyledContainerWrapper>
            </Wrapper>
        );
    }
}

const ChannelAddForm = styled(Form)`
`

const ChannelSearchForm = styled(Form)`
`

const ChannelWrap = styled.div`
    display: flex;
    color: black;
    flex-direction: column;
    padding-bottom: ${({isUpdate}) => (isUpdate ? 75 : 30)}px;
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
    border: 1px solid ${props => props.theme.outline};
    cursor: pointer;
    background-color: ${props => props.theme.clientSecondary.bg};
`;

const Wrapper = styled.div`
    width: 100%;
`;

const TabPanel = styled.div`
    overflow-y: auto;
    width: 100%;
    display: block;
    max-height: 100vh;
    background-color: ${props => props.theme.clientSecondary.bg};
`;

const StyledFooter = styled.div`
    background-color: ${props => props.theme.client.bg};
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
const LoadingWrapper = styled.div`
    width: 100%;
    height: 100vh;
    display: flex; 
    align-items: center;
    justify-content: center;
    flex-direction: column;
`

const LoadingText = styled.div`
    font-weight: bold;
`

const rotate360 = keyframes`
	from {transform: rotate(0deg);}
    to {transform: rotate(360deg);}
`;

const LoadingIcon = styled(Icon)`
    color: #347eff;
    animation: ${rotate360} 2s linear infinite;
    margin-bottom: 50px;
    & > svg {
        width: 60px;
        height: 60px;
    }
`

const TabWrapper = styled.div`
    height: 100%;
    background-color: ${props => props.theme.client.bg};
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    border-right: 1px solid ${props => props.theme.outline};
    position: relative;
    z-index: 2;
`;

export default ChannelContainer