import React, {Component} from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'
import {Field, reduxForm} from 'redux-form'

const {remote} = window.require('electron');
const {Menu} = remote;


let template = [
    {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    },
    {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    },
    {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    },
    {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }
];


const openMenu = () => {
    const macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());
}



export default class EditForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            value: props.channel.visibleName
        }
    }

    onChange = (e) => {
        this.setState({value: e.target.value})
    }

    onBlur = (e) => {
        this.props.nameChange(e.target.value, this.props.channel.id)
    }

    handleSubmit = (e) => {
        const {value} = this.state;
        const {channel} = this.props;
        this.props.nameChange(value, channel.id);
        e.preventDefault();

    }

    render() {
        const {value} = this.state;
        return (
            <Form onSubmit={this.handleSubmit}>
                <StyledField
                    name="visibleName"
                    component='input'
                    type="text"
                    value={value}
                    onChange={(e) => this.onChange(e)}
                    onBlur={(e) => this.onBlur(e)}
                />

            </Form>
        )
    }
}


const Form = styled.form`
    width: 100%;
    margin-right: 10px;
    display: flex;
    height: 20px;
    align-items: center;
`

const StyledField = styled.input`
    width: 100%;
    height: 18px;
    padding: 0px;
    margin: 0px;
`
