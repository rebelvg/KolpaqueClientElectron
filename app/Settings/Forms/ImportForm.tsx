import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import { close } from 'react-icons-kit/fa/close';
import { Field } from 'react-final-form';
import styled, { withTheme } from 'styled-components';

const TextField = ({ input, ...rest }) => <MemberInput {...input} />;

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
    const { members, theme } = this.props;

    return (
      <Form onSubmit={this.submit}>
        <Field
          name="member"
          placeholder="Enter twitch nickname..."
          component={TextField}
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

const MemberInput = styled.input`
  background-color: ${(props) => props.theme.input.bg};
  color: ${(props) => props.theme.input.color};
  border: none;
  padding: 5px;
  outline: 1px solid ${(props) => props.theme.outline};
`;

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
