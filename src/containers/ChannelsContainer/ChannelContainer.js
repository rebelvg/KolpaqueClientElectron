import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Ionicon from 'react-ionicons'
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import './style.css';
import ChannelWrapper from '../../components/Channels/ChannelWrapper/ChannelWrapper'
import ChannelForm from '../../components/Channels/ChannelForm/ChannelForm'
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

const mockData = [
    {
        'live': false,
        "service": "klpq-main",
        "name": "klpq",
        "link": "rtmp://main.klpq.men/live/klpq",
        "protocol": "rtmp:"
    },
    {
        'live': true,
        "service": "klpq-main",
        "name": "murshun",
        "link": "rtmp://main.klpq.men/live/murshun",
        "protocol": "rtmp:"
    },
    {
        'live': false,
        "service": "twitch",
        "name": "xra_",
        "link": "https://www.twitch.tv/xra_",
        "protocol": "https:"
    },
    {
        'live': true,
        "service": "twitch",
        "name": "adam_ak",
        "link": "https://www.twitch.tv/adam_ak",
        "protocol": "https:"
    },
];

export class ChannelContainer extends Component {
    constructor() {
        super()
    }

    render() {
        const offlineChannels = mockData.filter((channel) => (!channel.live));
        const onlineChannels = mockData.filter((channel) => (!!channel.live));
        return (
            <StyledContainerWrapper>
                <Tabs>
                    <TabList className="tabs">
                        <Tab className='tab' selectedClassName="active">Online</Tab>
                        <Tab className='tab' selectedClassName="active">Offline</Tab>
                    </TabList>

                    <TabPanel>
                        <ChannelWrapper channels={onlineChannels}/>
                    </TabPanel>
                    <TabPanel>
                        <ChannelWrapper channels={offlineChannels}/>
                    </TabPanel>
                </Tabs>

                <StyledFooter className="fixed-bottom">
                    <ChannelForm/>
                    <SettingsIcon to="/about"><Ionicon icon="ion-settings" color="white"/></SettingsIcon>
                </StyledFooter>
            </StyledContainerWrapper>
        );
    }
}
const StyledFooter = styled.div`
    background-color: #262626;
    color: white;
`;
const SettingsIcon = styled(Link)`
    display: flex;
    padding: 2px;
`;
const StyledContainerWrapper = styled.div`
  
`

const pickState = ({counter}) => ({
    //state: {counter},
});

const mapDispatch = dispatch => ({
    //actions: bindActionCreators(actions, dispatch),
});

const ConnectedChannelContainer = connect(pickState, mapDispatch)(ChannelContainer);

export default ConnectedChannelContainer;

