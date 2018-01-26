import React, {Component} from 'react';
import styled from 'styled-components'
import theme from '../../../theme'
import {template} from '../../constants';
import {Field} from 'react-final-form'
import AutoSave from './AutoSave'
const {remote} = window.require('electron');
const {Menu} = remote;

const openMenu = () => {
    const macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());
}

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
                <AutoSave save={save} debounce={300}/>
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
    z-index: 100000
`

const StyledField = styled(Field)`
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
        background-color:${theme.input.bg};
        color:${theme.input.color};
        width: 100%;
        border: none;
        height:20px;
        font-size:12px;
        border-top: 1px solid ${theme.outline};
        padding: 0 10px;
    }
`
