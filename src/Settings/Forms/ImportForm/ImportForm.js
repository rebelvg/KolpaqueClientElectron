/**
 * Created by JackP on 10/8/2017.
 */
import React, {Component} from 'react'
import Icon from 'react-icons-kit';
import {close} from 'react-icons-kit/fa/close';
import styled from 'styled-components'
import theme from '../../../theme'


export default class ImportForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            members: props.members,
            value: ''
        }
    }

    addMember = (e) => {
        console.log(e.target.value);
        const {members, value} = this.state;
        this.setState({
            members: [...members, value],
            value: ""
        })
        e.preventDefault();
    }

    removeMember = (index) => {
        const {members} = this.state;
        this.setState({
            members: members.filter((member, m_index) => m_index !== index)
        });
    }


    render() {
        const {members, value} = this.state;
        return (
            <div>
                <form onSubmit={(e) => this.addMember(e)}>
                    <MemberInput value={value} onChange={(e) => this.setState({value: e.target.value})} name="member"
                                 type="text"
                                 placeholder="Enter username"/>
                    <AddBtn type="button">Import channels</AddBtn>
                    <AddBtn type="submit">Add to auto import</AddBtn>
                </form>
                <MemberWrap>
                    <MemberTitle>Auto Import List</MemberTitle>
                    {members.map((member, index) =>
                        <Member key={member + index}>
                            <MemberName> {member} </MemberName>
                            <Icon style={{cursor: "pointer"}} onClick={() => this.removeMember(index)} icon={close}
                                  color={theme.client.color}/>
                        </Member>
                    )}
                </MemberWrap>
            </div>
        )
    }
}

const MemberInput = styled.input`
    width: 100%;
    background-color:${theme.input.bg};
    color:${theme.input.color};
    border: 1px solid ${theme.outline};
`

const AddBtn = styled.button`
    background-color: transparent;
    border: 1px solid ${theme.klpq};
    color: ${theme.klpq};
    margin: 5px 0px;
    cursor: pointer;
    width: 50%;
    font-size:14px;
`

const MemberTitle = styled.div`
    color: ${theme.client.color};
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    padding: 5px 0px;
`
const MemberName = styled.div`
flex-grow:1;
`
const MemberWrap = styled.div`
    margin-top: 10px;
`
const Member = styled.div`
    color: ${theme.client.color};
    display: flex;
    align-items: center;
    outline: 1px solid ${theme.outline};
    padding: 5px 20px;
`