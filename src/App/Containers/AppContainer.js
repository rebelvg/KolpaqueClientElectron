import React, {Component} from 'react';
import Routes from '../Components/Routes';
import EventListener from '../Components/EventListener'
import {HashRouter} from 'react-router-dom'
import {ThemeProvider} from 'styled-components'
import styled, {injectGlobal} from 'styled-components';
import {connect} from 'react-redux';
import {themes} from '../../Themes'
import {globalStyle} from '../../globalStyle'
import {getTheme} from '../../redux/settings'

injectGlobal`${globalStyle}`

@connect(
    state => ({
        nightMode: getTheme(state)
    }),
)
export default class AppContainer extends Component {
    constructor() {
        super()
    }

    render() {
        const {nightMode} = this.props
        const theme = nightMode ? themes['nightTheme'] : themes['defaultTheme']
        return (
            <Container>
                <ThemeProvider theme={theme}>
                    <HashRouter>
                        <Container>
                            <Routes/>
                            <EventListener/>
                        </Container>
                    </HashRouter>
                </ThemeProvider>
            </Container>
        )
    }
}

const Container = styled.div`
	height: 100%
`
