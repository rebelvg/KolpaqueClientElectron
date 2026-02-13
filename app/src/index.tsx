import { createRoot } from 'react-dom/client';
import AppContainer from './App/Containers/AppContainer';
import 'normalize.css/normalize.css';
import './style.css';

const appElement = document.createElement('div');

appElement.setAttribute('id', 'app');
document.body.appendChild(appElement);

const root = createRoot(appElement);

root.render(<AppContainer />);

if (module['hot']) {
  module['hot'].accept();
}
