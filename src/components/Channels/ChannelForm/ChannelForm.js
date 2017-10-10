import React from 'react';
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
    var macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());
}

let ChannelForm = (props) => {
    const {handleSubmit} = props
    return (
        <form onSubmit={ handleSubmit }>
            <StyledChannelFormWrap>
                <StyledInput onContextMenu={() => openMenu()} component="input" name="channel" placeholder="Add Channel" type="text"/>
                <button type="submit">
                    <StyledIcon fontSize="24px" icon="ion-plus"/>
                </button>
            </StyledChannelFormWrap>
        </form>
    )
};

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
        background-color: #fff;
    background-image: none;
    background-clip: padding-box;
    height: 24px;
   border: none;
   border-top: 1px solid lightgray;
   box-shadow: none;
   box-sizing: border-box;
       font-size: 14px;
    padding-left: 10px;
`;

const StyledIcon = styled(Ionicon)`
  background-color:white;
  color:white;
  display: flex;
  box-sizing: border-box;
  border: 1px solid lightgray;

  font-size:24px;
`;

ChannelForm = reduxForm({
    // a unique name for the form
    form: 'addChannel'
})(ChannelForm)

export default ChannelForm;