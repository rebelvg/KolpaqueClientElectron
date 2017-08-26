import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Button from 'src/components/Shared/Button';

import * as actions from 'src/redux/actions/counter';

import './style.css';

class Counter extends Component {
    state = {cnt: 0};

    add = () => {
        this.props.actions.add();
    }

    subtract = () => {
        this.props.actions.subtract();
    }

    render() {
        return (
            <div className="container">
                TEST
                <Button onClick={this.subtract}>-</Button>
                &nbsp;|&nbsp;{this.props.state.counter.count}&nbsp;|&nbsp;
                <Button onClick={this.add}>+</Button>
            </div>
        );
    }
}

const pickState = ({counter}) => ({
    state: {counter},
});

const mapDispatch = dispatch => ({
    actions: bindActionCreators(actions, dispatch),
});

const ConnectedCounter = connect(pickState, mapDispatch)(Counter);

export default ConnectedCounter;
