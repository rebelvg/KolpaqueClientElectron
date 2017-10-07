import React from 'react';
import {Route} from 'react-router-dom';
import styled from 'styled-components'
import About from './Shared/About';
import Counter from './Shared/Counter';

import ChannelContainer from '../containers/ChannelsContainer/ChannelContainer';

const RouterRoutes = () => (
	<RouterWrapper>
		<Route exact path="/" component={ChannelContainer}/>
		<Route path="/about" component={About}/>
	</RouterWrapper>
);

export default RouterRoutes;

const RouterWrapper = styled.div`
    display: flex;
    height:100%;
    width:100%;
`