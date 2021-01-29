import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import { close } from 'react-icons-kit/fa/close';
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

    console.log(values);

    const member = values.member;

    console.log('member', member);

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
    const { members, theme, changeSetting } = this.props;

    return (
      <Form onSubmit={this.submit}>
        <FieldWrapper>
          <Label>Enable Kolpaque Import</Label>
          <InputWrapper>
            <Field
              name="enableKolpaqueImport"
              component={ToggleAdapter}
              toggle={changeSetting}
            />
          </InputWrapper>
        </FieldWrapper>

        <FieldWrapper>
          <Label>Enable Twitch Import</Label>
          <InputWrapper>
            <Field
              name="enableTwitchImport"
              component={ToggleAdapter}
              toggle={changeSetting}
            />
          </InputWrapper>
        </FieldWrapper>

        <br />
        <br />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          Twitch Import Settings
        </div>

        <StyledField
          name="member"
          type="text"
          component="input"
          placeholder="Twitch channel..."
        />
        <BtnWrap>
          <AddBtn type="button" onClick={this.addMember}>
            Import Channels Once
          </AddBtn>

          <AddBtn type="submit">Add to Auto-Import</AddBtn>
        </BtnWrap>

        <MemberWrap>
          <MemberTitle>Twitch Auto-Import List</MemberTitle>
          {members.map((member, index) => (
            <Member key={member + index}>
              <MemberName> {member} </MemberName>
              <Icon
                style={{ cursor: 'pointer' }}
                onClick={() => this.removeMember(member)}
                icon={close}
                color={theme.client.color}
              />
            </Member>
          ))}
        </MemberWrap>
      </Form>
    );
  }
}

const AddBtn = styled.button`
  background-color: transparent;
  border: 1px solid ${(props) => props.theme.klpq};
  color: ${(props) => props.theme.klpq};
  margin: 5px 0px;
  cursor: pointer;
  width: 50%;
  font-size: 14px;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const BtnWrap = styled.div`
  display: flex;
`;

const MemberTitle = styled.div`
  color: ${(props) => props.theme.client.color};
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 5px 0px;
`;

const MemberName = styled.div`
  flex-grow: 1;
`;

const MemberWrap = styled.div`
  margin-top: 10px;
`;

const Member = styled.div`
  color: ${(props) => props.theme.client.color};
  display: flex;
  align-items: center;
  border-top: 1px solid ${(props) => props.theme.outline};
  padding: 5px 20px;
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

const StyledField = styled(Field)`
  width: 100%;
  height: 18px;
  padding: 0px;
  margin: 0px;
  position: relative;
  z-index: 100000;
`;
