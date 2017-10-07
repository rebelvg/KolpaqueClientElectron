import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import RouterRoutes from '../../components/RouterRoutes';
import EventListener from '../../components/Shared/EventListener/EventListener'

import styled from 'styled-components';

export default class AppContainer extends Component {

    constructor() {
        super()
    }


    render() {
        return (
            <Container>
                <RouterRoutes/>
                <EventListener/>
            </Container>
        )
    }
}

const Container = styled.div`
	height: 100%
`

