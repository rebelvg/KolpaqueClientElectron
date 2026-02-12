import React, { Component } from 'react';
import { Field, FormRenderProps } from 'react-final-form';
import styled from 'styled-components';
import { ToggleAdapter } from './SettingsForm';
import { Settings } from '../../Shared/types';

type ImportFormProps = FormRenderProps<any> & {
  members: string[];
  submit: (members: string[]) => void;
  importChannel: (name: string) => void;
  changeSetting?: (value: boolean, name: string) => void;
};

export default class ImportForm extends Component<ImportFormProps> {
  removeMember = (member: string) => {
    const { members, submit } = this.props;

    submit([...members.filter((m) => m !== member)]);
  };

  addMember = () => {
    const { values, form, importChannel } = this.props;

    const member = (values as Settings & { member?: string }).member;

    if (member) {
      importChannel(member);
    }

    form.reset();
  };

  submit = (event?: React.FormEvent<HTMLFormElement>) => {
    const { handleSubmit, values, form, submit, members } = this.props;

    const member = (values as Settings & { member?: string }).member;

    if (member) {
      submit([...members, member]);
    }
    handleSubmit(event);
    form.reset();
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

interface FieldWrapperProps {
  full?: boolean;
}

const FieldWrapper = styled.div<FieldWrapperProps>`
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
