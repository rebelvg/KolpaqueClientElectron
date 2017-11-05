import createTheme from 'styled-components-theme';
import defaultColors from './Themes/default' // from Step #1
import nightTheme from './Themes/night' // from Step #1

const {ipcRenderer} = window.require('electron');
const nightMode = ipcRenderer.sendSync('getSettingSync', 'nightMode');
console.log(nightMode)
const colors = !nightMode ? defaultColors : nightTheme
const theme = createTheme(...Object.keys(colors))

export default {...theme, ...colors, nightMode}