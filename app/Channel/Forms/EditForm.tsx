import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';
import { openMenu } from '../constants';

@withTheme
export default class EditForm extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      value: props.channel.visibleName,
    };
  }

  onChange = (v) => {
    this.setState({ value: v });
  };

  renameChannel = () => {
    const { value } = this.state;
    const { channel } = this.props;

    this.props.nameChange(value, channel.id);
  };

  render() {
    const { value } = this.state;

    return (
      <Form onSubmit={this.renameChannel}>
        <StyledField
          name="visibleName"
          component="input"
          type="text"
          value={value}
          onContextMenu={() => {
            openMenu();
          }}
          onChange={(e) => this.onChange(e.target.value)}
          onBlur={() => this.renameChannel()}
        />
      </Form>
    );
  }
}

const Form = styled.form`
  width: 100%;
  margin-right: 10px;
  display: flex;
  height: 20px;
  align-items: center;
  position: relative;
  z-index: 100000;
`;

const StyledField = styled.input`
  width: 100%;
  height: 18px;
  padding: 0px;
  margin: 0px;
  position: relative;
  z-index: 100000;
  background-color: ${(props) => props.theme.input.bg};
  color: ${(props) => props.theme.input.color};
  border: 1px solid ${(props) => props.theme.outline};
`;
