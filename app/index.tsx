import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './app';
import 'normalize.css/normalize.css';
import './style.css';

const appElement = document.createElement('div');

appElement.setAttribute('id', 'app');
document.body.appendChild(appElement);

ReactDOM.render(<App />, document.getElementById('app'));

if (module['hot']) {
  module['hot'].accept();
}
