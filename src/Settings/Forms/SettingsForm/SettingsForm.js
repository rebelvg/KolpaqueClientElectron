/**
 * Created by JackP on 10/8/2017.
 */
import React from 'react'
import {Field} from 'react-final-form'
import Toggle from 'react-toggle-button'
import styled from 'styled-components'
import Select from 'react-select';

const sortTypes = [
    {value: 'lastAdded', label: 'Last Added'},
    {value: 'lastUpdated', label: 'Last Updated'},
    {value: 'service_visibleName', label: 'By Name and Service'},
    {value: 'visibleName', label: 'By Name'},
]

const ToggleAdapter = ({input: {onChange, name, value}, toggle, getSettings, label, ...rest}) => (
    <Toggle
        value={value}
        onToggle={(value) => {
            toggle(!value, name);
            onChange(!value)
        }}
        inactiveLabel={''}
        activeLabel={''}
        {...rest}
    />
)

const ReactSelectAdapter = ({input, ...rest}) => (
    <Select {...input} {...rest} searchable/>
)

const SettingsForm = ({handleSubmit, pristine, reset, submitting, getSettings, values}) => (
    <Form onSubmit={handleSubmit}>
        <FieldWrapper>
            <Label>LQ</Label>
            <InputWrapper>
                <Field
                    name="LQ"
                    component={ToggleAdapter}
                    toggle={getSettings}
                />
            </InputWrapper>
        </FieldWrapper>
        <FieldWrapper>
            <Label>Show Notifications</Label>
            <InputWrapper>
                <Field
                    name="showNotifications"
                    component={ToggleAdapter}
                    toggle={getSettings}
                />
            </InputWrapper>
        </FieldWrapper>
        <FieldWrapper>
            <Label>Minimize At Start</Label>
            <InputWrapper>
                <Field
                    name="minimizeAtStart"
                    component={ToggleAdapter}
                    toggle={getSettings}
                />
            </InputWrapper>
        </FieldWrapper>
        <FieldWrapper>
            <Label>Play On Balloon Click</Label>
            <InputWrapper>
                <Field
                    name="launchOnBalloonClick"
                    component={ToggleAdapter}
                    toggle={getSettings}
                />
            </InputWrapper>
        </FieldWrapper>

        <FieldWrapper>
            <Label>Night Mode </Label>
            <InputWrapper>
                <Field
                    name="nightMode"
                    component={ToggleAdapter}
                    toggle={getSettings}
                />
            </InputWrapper>
        </FieldWrapper>

        <FieldWrapper full>
            <Label>Youtube Api Key</Label>
            <InputWrapper>
                <InputField
                    name="youtubeApiKey"
                    component="input"
                    type="password"
                />
            </InputWrapper>
        </FieldWrapper>
        <hr/>
        <SelectWrapper>
            <Label>Sort Mode </Label>
            <SelectField
                name="sortType"
                component={ReactSelectAdapter}
                options={sortTypes}

            />
        </SelectWrapper>
        <FieldWrapper>
            <Label>Reversed Sort </Label>
            <InputWrapper>
                <Field
                    name="sortReverse"
                    component={ToggleAdapter}
                    toggle={getSettings}
                />
            </InputWrapper>
        </FieldWrapper>
    </Form>
)

const Form = styled.form`
    display: flex;
    flex-direction: column;
    height: 100%;
    
`

const SelectWrapper = styled.div`
    margin: 2px 20px;
`

const SelectField = styled(Field)`
    margin-bottom: 20px;
`

const FieldWrapper = styled.div`
    display: flex;
    flex-direction: ${props => !!props.full ? 'column' : 'row' };
    justify-content: space-between;
    margin: 2px 20px;
`

const Label = styled.label`
    font-weight: bold;
    font-size: 15px;
    color: ${props => props.theme.client.color};
    padding-bottom:10px;
`

const InputWrapper = styled.div`
   
`

const InputField = styled(Field)`
    width: 100%;
`

export default SettingsForm
