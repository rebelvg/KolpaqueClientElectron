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
            <div>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                </ul>
                <RouterRoutes/>
            </div>
        );
    }
}

const pickState = ({counter}) => ({});

const mapDispatch = dispatch => ({});

const ConnectedApp = connect(pickState, mapDispatch)(AppContainer);

//export default ConnectedApp;
