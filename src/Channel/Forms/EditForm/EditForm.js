import React, {Component} from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'

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

    onChange = (v) => {
        this.setState({value: v})
    }


    renameChannel = (e) => {
        const {value} = this.state;
        const {channel} = this.props;
        console.log(value);
        this.props.nameChange(value, channel.id);
        e.preventDefault();

    }

    render() {
        const {value} = this.state;
        return (
            <Form onSubmit={this.renameChannel}>
                <StyledField
                    name="visibleName"
                    component='input'
                    type="text"
                    value={value}
                    onContextMenu={(e) => {
                        openMenu()
                    }}
                    onChange={(e) => this.onChange(e.target.value)}
                    onBlur={(e, v) => this.renameChannel}
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
    position: relative;
    z-index: 100000
`

const StyledField = styled.input`
    width: 100%;
    height: 18px;
    padding: 0px;
    margin: 0px;
    position: relative;
    z-index: 100000
`
