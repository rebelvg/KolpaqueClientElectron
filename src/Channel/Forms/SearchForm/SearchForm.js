import React, {Component} from 'react';
import styled from 'styled-components'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {debounce} from 'lodash'
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


class SearchForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            value: ''
        }
        this.setFilter = debounce(this.props.setFilter, 400)
    }


    onChange = (value) => {
        this.setState({value: value}, () => {
            this.setFilter(value)
        })
    }


    handleSubmit = (e) => {
        e.preventDefault()

    }


    render() {
        const {value} = this.state;
        return (
            <Form onSubmit={this.handleSubmit}>
                <InputWrapper>
                    <StyledField
                        name="filter"
                        type="text"
                        value={value}
                        onContextMenu={() => {
                            openMenu()
                        }}
                        onChange={(e) => this.onChange(e.target.value)}
                        onBlur={(e) => this.handleSubmit}/>
                </InputWrapper>

            </Form>
        )
    }
}
export default SearchForm;

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

const InputWrapper = styled.div`
    height:20px;
    width:100%;
    overflow: hidden;
    & > input {
        width: 100%;
        border: none;
        height:20px;
        font-size:12px;
        border-top: 1px solid #979797;
        padding: 0 10px;
    }
    `
