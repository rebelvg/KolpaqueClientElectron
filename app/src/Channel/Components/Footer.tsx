import React, { Component } from 'react';
import styled from 'styled-components';
import ChannelForm from '../../Channel/Forms/ChannelForm';
import { addChannel } from '../../Channel/Helpers/IPCHelpers';
import { Form } from 'react-final-form';

export default class Footer extends Component<Record<string, never>> {
  submit = ({ channel }: { channel?: string }) => {
    if (channel) {
      addChannel(channel);
    }
  };

  render() {
    return (
      <FooterWrapper>
        <Form
          onSubmit={this.submit}
          render={(props) => <ChannelForm {...props} />}
        />
      </FooterWrapper>
    );
  }
}

const FooterWrapper = styled.div`
  background-color: ${(props) => props.theme.client.bg};
  color: white;
  position: fixed;
  bottom: 0px;
  width: 100%;
  z-index: 3;
`;
