import React from 'react';
import {Route} from 'react-router-dom';

import About from './About';
import Counter from './Counter';

const RouterRoutes = () => (
    <div>
        <Route exact path="/" component={Counter}/>
        <Route path="/about" component={About}/>
    </div>
);

export default RouterRoutes;
