/**
 * Created by JackP on 10/8/2017.
 */
import React from 'react'
import {Field, reduxForm, FieldArray} from 'redux-form'

import styled from 'styled-components'


const ImportForm = ({handleSubmit, pristine, reset, submitting, getSettings}, initialValues) => (
    <Form initialValues={initialValues} onSubmit={handleSubmit}>

    </Form>
)

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

const InputField = styled(Field)`
    width: 100%;
`

export default reduxForm({
    form: 'settings' // a unique identifier for this form
})(ImportForm)