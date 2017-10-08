import React from 'react';
import {Route} from 'react-router-dom';
import styled from 'styled-components'


import ChannelContainer from '../containers/ChannelsContainer/ChannelContainer';
import SettingsContainer from '../containers/SettingsContainer/SettingsContainer';

const RouterRoutes = () => (
    <RouterWrapper>
        <Route exact path="/" component={ChannelContainer}/>
        <Route path="/about" component={SettingsContainer}/>
    </RouterWrapper>
);

export default RouterRoutes;

const RouterWrapper = styled.div`
    display: flex;
    height:100%;
    width:100%;
`