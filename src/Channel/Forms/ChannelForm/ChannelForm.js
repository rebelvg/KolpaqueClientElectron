import React, {Component} from 'react';
import Ionicon from 'react-ionicons'
import styled, {withTheme} from 'styled-components'
import {template} from '../../constants';
import {Field} from 'react-final-form'
const {remote} = window.require('electron');
const {Menu} = remote;

const openMenu = () => {
    var macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());
}
@withTheme
export default class ChannelForm extends Component {
    handleSubmit = (data) => {
        const {handleSubmit, reset} = this.props;
        handleSubmit(data);
        reset();
    }

    render() {
        const {theme} = this.props
        return (
            <form onSubmit={this.handleSubmit}>
                <StyledChannelFormWrap>
                    <StyledInput onContextMenu={() => openMenu()}
                                 component="input"
                                 name="channel"
                                 placeholder="Add Channel..."
                                 type="text"/>
                    <button type="submit">
                        <StyledIcon fontSize="24px" color={theme.input.color} icon="ion-plus"/>
                    </button>
                </StyledChannelFormWrap>
            </form>
        )
    }
}


const StyledChannelFormWrap = styled.div`
    display: flex;
    align-items: center;
    padding: 2px;
    & button {
        -webkit-appearance: none;
        border:none;
        padding: 0;
        margin: 0;
        cursor: pointer
    }
`;

const StyledInput = styled(Field)`
    flex-grow:2;
    width: 100%;
    display: flex;
    background-color: ${props => props.theme.input.bg};
    color: ${props => props.theme.input.color};
    background-image: none;
    background-clip: padding-box;
    height: 24px;
    border: none;
    border-top: 1px solid ${props => props.theme.outline};
    box-shadow: none;
    box-sizing: border-box;
    font-size: 14px;
    padding-left: 10px;
`;

const StyledIcon = styled(Ionicon)`
    background-color:${props => props.theme.input.bg};
    color:white;
    display: flex;
    box-sizing: border-box;
    border: 1px solid ${props => props.theme.outline};
    border-left: 0px;
    font-size:24px;
`;