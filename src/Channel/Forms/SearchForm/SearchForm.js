import React, {Component} from 'react';
import styled, {withTheme} from 'styled-components'
import {Field} from 'react-final-form'
import Icon from 'react-icons-kit';
import {search} from 'react-icons-kit/fa/search';
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
        const {save} = this.props;
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
                    <button type="button">
                        <StyledIcon size={14} icon={search}/>
                    </button>
                </InputWrapper>
                <AutoSave save={save} debounce={600}/>
            </Form>
        )
    }
}
export default SearchForm;

const Form = styled.div`
    flex-grow:2;
    width: 100%;
    margin-right: 10px;
    display: flex;
    height: 20px;
    align-items: center;
    position: relative;
    z-index: 100000;
    padding: 2px 0px;
    background-color: ${props => props.theme.client.bg};
    & button {
        -webkit-appearance: none;
        border:none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        background-color:${props => props.theme.input.bg};
        display: flex !important;
        box-sizing: border-box;
        border: 1px solid ${props => props.theme.outline};
        border-left: 0px;
        width: 20px;
        height: 20px;
        align-items: center;
        justify-content: center;
    }
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
    display: flex;
    align-items: center;
    & > input {
        background-color:${props => props.theme.input.bg};
        color:${props => props.theme.input.color};
        border:1px solid ${props => props.theme.outline};
        border-right: none;
        width: 100%;
        height:20px;
        font-size:12px;
        padding: 0 10px;
        box-sizing: border-box;
    }
`

const StyledIcon = styled(Icon)`  
    color:${props => props.theme.input.color};
`;