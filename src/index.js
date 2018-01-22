import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {HashRouter} from 'react-router-dom'
import {ThemeProvider} from 'styled-components'
import colors from './Themes/default';
import AppContainer from './App/Containers/AppContainer'
import 'normalize.css/normalize.css'
import './style.css'
import store from './store';

const appElement = document.createElement('div');
appElement.setAttribute('id', 'app');
document.body.appendChild(appElement);

ReactDOM.render(
    <Provider store={store}>
        <ThemeProvider theme={colors}>
            <HashRouter>
                <AppContainer/>
            </HashRouter>
        </ThemeProvider>
    </Provider>,
    document.getElementById('app'),
);

if (module.hot) {
    module.hot.accept()
}
