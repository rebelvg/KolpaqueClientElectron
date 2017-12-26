import React, {Component} from 'react';
import Routes from '../Components/Routes';
import EventListener from '../Components/EventListener'

import styled from 'styled-components';

export default class AppContainer extends Component {
    constructor() {
        super()
    }

    render() {
        return (
            <Container>
                <Routes/>
                <EventListener/>
            </Container>
        )
    }
}

const Container = styled.div`
	height: 100%
`
