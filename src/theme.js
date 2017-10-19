import createTheme from 'styled-components-theme';
import colors from './colors' // from Step #1

const theme = createTheme(...Object.keys(colors))
export default {...theme, ...colors}