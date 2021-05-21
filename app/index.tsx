import React from 'react';
import ReactDOM from 'react-dom';
import AppContainer from './App/Containers/AppContainer';
import 'normalize.css/normalize.css';
import './style.css';
const appElement = document.createElement('div');

appElement.setAttribute('id', 'app');
document.body.appendChild(appElement);

ReactDOM.render(<AppContainer />, document.getElementById('app'));

if (module['hot']) {
  module['hot'].accept();
}
