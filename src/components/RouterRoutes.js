import React from 'react';
import {Route} from 'react-router-dom';

import About from './Shared/About';
import Counter from './Shared/Counter';

import ChannelContainer from '../containers/ChannelsContainer/ChannelContainer';

const RouterRoutes = () => (
    <div>
        <Route exact path="/" component={ChannelContainer}/>
        <Route path="/about" component={About}/>
    </div>
);

export default RouterRoutes;
