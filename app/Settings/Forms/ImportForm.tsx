import React, { Component } from 'react';
import { Field } from 'react-final-form';
import styled, { withTheme } from 'styled-components';
import { ToggleAdapter } from './SettingsForm';

@withTheme
export default class ImportForm extends Component<any> {
  removeMember = (member) => {
    const { members, submit } = this.props;

    submit([...members.filter((m) => m !== member)]);
  };

  addMember = () => {
    const { values, reset, importChannel } = this.props;

    const member = values.member;

    importChannel(member);

    reset();
  };

  submit = (data) => {
    const { handleSubmit, values, reset, submit, members } = this.props;

    const member = values.member;

    if (member) {
      submit([...members, member]);
    }
    handleSubmit(data);
    reset();
  };

  render() {
    const { changeSetting } = this.props;

    return (
      <Form onSubmit={this.submit}>
        {/* <FieldWrapper>
          <Label>Enable Kolpaque Import</Label>
          <InputWrapper>
            <Field
              name="enableKolpaqueImport"
              component={ToggleAdapter}
              toggle={changeSetting}
            />
          </InputWrapper>
        </FieldWrapper> */}
      </Form>
    );
  }
}

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.full ? 'column' : 'row')};
  justify-content: space-between;
  margin: 2px 20px;
`;

const Label = styled.label`
  font-weight: bold;
  font-size: 15px;
  color: ${(props) => props.theme.client.color};
  padding-bottom: 10px;
`;

const InputWrapper = styled.div``;
