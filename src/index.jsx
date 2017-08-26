import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Link } from 'react-router-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import About from 'src/components/About';
import Counter from 'src/components/Counter';

import store from 'src/store';

import s from './style.css';

const appElement = document.createElement('div');
appElement.setAttribute('id', 'app');
document.body.appendChild(appElement);

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <ul className={s.navList}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>

        <hr/>

        <Route exact path="/" component={Counter}/>
        <Route path="/about" component={About}/>
      </div>
    </BrowserRouter>
  </Provider>,
  document.getElementById('app'),
);

if (module.hot) {
  module.hot.accept('src/components/Counter', function() {
    console.log('Accepting the updated printMe module!');
    printMe();
  })
}
