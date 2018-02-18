import React, {Component} from 'react';
import styled, {withTheme} from 'styled-components'
import {Field} from 'react-final-form'

import {template} from 'src/Channel/constants';
import AutoSave from './AutoSave'
const {remote} = window.require('electron');
const {Menu} = remote;

const openMenu = () => {
    const macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());
}
@withTheme
class SearchForm extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {handleSubmit, save} = this.props;
        return (
            <Form >
                <InputWrapper>
                    <StyledField
                        name="filter"
                        type="text"
                        component="input"
                        placeholder="Search..."
                        onContextMenu={() => {
                            openMenu()
                        }}
                    />
                </InputWrapper>
                <AutoSave save={save} debounce={600}/>
            </Form>
        )
    }
}
export default SearchForm;

const Form = styled.div`
    width: 100%;
    margin-right: 10px;
    display: flex;
    height: 20px;
    align-items: center;
    position: relative;
    z-index: 100000;
    padding: 2px 0px;
    background-color: ${props => props.theme.client.bg};
`

const StyledField = styled(Field)`
    width: 100%;
    height: 18px;
    padding: 0px;
    margin: 0px;
    position: relative;
    z-index: 100000;
`

const InputWrapper = styled.div`
    height:20px;
    width:100%;
    overflow: hidden;
    padding: 2px 3px;
    & > input {
        background-color:${props => props.theme.input.bg};
        color:${props => props.theme.input.color};
        border:1px solid ${props => props.theme.outline};
        width: 100%;
        height:20px;
        font-size:12px;
        padding: 0 10px;
        box-sizing: border-box;
    }
`
