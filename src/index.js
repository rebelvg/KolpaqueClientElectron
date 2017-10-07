import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import styled from 'styled-components'
import AppContainer from './containers/AppContainer/AppContainer'
import RouterRoutes from './components/RouterRoutes'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'normalize.css/normalize.css'
import store from './store';

const appElement = document.createElement('div');
appElement.setAttribute('id', 'app');
document.body.appendChild(appElement);

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter basename='/'>
            <AppContainer/>
        </BrowserRouter>
    </Provider>,
    document.getElementById('app'),
);

if (module.hot) {
    module.hot.accept()
}
