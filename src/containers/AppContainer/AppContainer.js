import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import RouterRoutes from '../../components/RouterRoutes';
import {Link} from 'react-router-dom';

export default class AppContainer extends Component {

    constructor() {
        super()
    }

    render() {
        return (
            <RouterRoutes/>
        );
    }
}

const pickState = ({counter}) => ({});

const mapDispatch = dispatch => ({});

const ConnectedApp = connect(pickState, mapDispatch)(AppContainer);

//export default ConnectedApp;
