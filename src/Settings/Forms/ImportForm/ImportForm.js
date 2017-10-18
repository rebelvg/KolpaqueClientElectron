/**
 * Created by JackP on 10/8/2017.
 */
import React, {Component} from 'react'
import Icon from 'react-icons-kit';
import styled from 'styled-components'

import {close} from 'react-icons-kit/fa/close';


const renderField = ({input, label, type, meta: {touched, error}}) => (
    <div>
        <div>
            <input {...input} type={type} placeholder={label}/>
        </div>
    </div>
)

const renderImport = ({fields, meta: {error, submitFailed}}) => (
    <ul>
        {fields.map((member, index) => (
            <li key={index}>
                <strong>${member}</strong>
                <Icon icon={close} onClick={() => fields.remove(index)}/>;
            </li>
        ))}
    </ul>
)

export default class ImportForm extends Component {
    constructor() {
        super()
    }

    render() {
        return <div>Test</div>

    }
}

const Form = styled.form`
    display: flex;
    flex-direction: column;
    height: 100%;
`

const FieldWrapper = styled.div`
    display: flex;
    flex-direction: ${props => !!props.full ? 'column' : 'row' };
    justify-content: space-between;
    margin: 10px 20px;
`

const Label = styled.label`
    font-weight: bold;
`

const InputWrapper = styled.div`
   
`

const InputField = styled.input`
    width: 100%;
`
