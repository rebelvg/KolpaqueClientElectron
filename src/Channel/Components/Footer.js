import React, { Component } from 'react';
import styled from 'styled-components';
import ChannelForm from 'src/Channel/Forms/ChannelForm';
import { addChannel } from 'src/Channel/Helpers/IPCHelpers';
import { Form } from 'react-final-form';

export default class Footer extends Component {
  constructor() {
    super();
  }

  submit = ({ channel }) => {
    if (channel) {
      addChannel(channel);
    }
  };

  render() {
    return (
      <FooterWrapper>
        <Form
          onSubmit={this.submit}
          render={props => <ChannelForm {...props} />}
        />
      </FooterWrapper>
    );
  }
}

const FooterWrapper = styled.div`
  background-color: ${props => props.theme.client.bg};
  color: white;
  position: fixed;
  bottom: 0px;
  width: 100%;
  z-index: 3;
`;
