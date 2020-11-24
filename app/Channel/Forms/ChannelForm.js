import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';
import { Field } from 'react-final-form';
import Icon from 'react-icons-kit';
import { plus } from 'react-icons-kit/fa/plus';
import { template } from '../../Channel/constants';

const { remote } = window.require('electron');
const { Menu } = remote;

const openMenu = () => {
  const macMenu = Menu.buildFromTemplate(template);
  macMenu.popup(remote.getCurrentWindow());
};

@withTheme
export default class ChannelForm extends Component {
  handleSubmit = (data) => {
    const { handleSubmit, reset } = this.props;
    handleSubmit(data);
    reset();
  };

  render() {
    const { theme } = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        <StyledChannelFormWrap>
          <StyledInput
            onContextMenu={() => openMenu()}
            component="input"
            name="channel"
            placeholder="Add Channel..."
            type="text"
          />
          <button type="submit">
            <StyledIcon size={14} icon={plus} />
          </button>
        </StyledChannelFormWrap>
      </form>
    );
  }
}

const StyledChannelFormWrap = styled.div`
  display: flex;
  align-items: center;
  padding: 2px 3px;
  & button {
    -webkit-appearance: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background-color: ${(props) => props.theme.input.bg};
    display: flex !important;
    box-sizing: border-box;
    border: 1px solid ${(props) => props.theme.outline};
    border-left: 0px;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
  }
`;

const StyledInput = styled(Field)`
  flex-grow: 2;
  width: 100%;
  display: flex;
  background-color: ${(props) => props.theme.input.bg};
  color: ${(props) => props.theme.input.color};
  background-image: none;
  background-clip: padding-box;
  height: 20px;
  border: none;
  border: 1px solid ${(props) => props.theme.outline};
  border-right: none;
  box-shadow: none;
  box-sizing: border-box;
  font-size: 12px;
  padding-left: 10px;
`;

const StyledIcon = styled(Icon)`
  color: ${(props) => props.theme.input.color};
`;
