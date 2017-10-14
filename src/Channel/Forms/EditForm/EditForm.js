import React from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'
import {Field, reduxForm} from 'redux-form'

const {remote} = window.require('electron');
const {Menu} = remote;


let template = [
    {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    },
    {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    },
    {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    },
    {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }
];

const openMenu = () => {
    const macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());
}

let EditForm = ({handleSubmit, nameChange, initialValues}) => {
    return (
        <Form onSubmit={ handleSubmit }>
            <Field
                name="visibleName"
                component='input'
                type="text"
                onBlur={(e, v) => nameChange(v, initialValues.id)}
            />

        </Form>
    )
};

const Form = styled.form`
`


export default reduxForm({
    form: 'editForm',
    enableReinitialize: true,
    destroyOnUnmount: false,
})(EditForm)