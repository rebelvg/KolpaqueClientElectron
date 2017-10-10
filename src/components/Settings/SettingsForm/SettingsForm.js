/**
 * Created by JackP on 10/8/2017.
 */
import React from 'react'
import {Field, reduxForm} from 'redux-form'
import Toggle from 'react-toggle';
import './toggle.css';
import styled from 'styled-components'

const renderToggleInput = (field) => (
    <div>
        <Toggle checked={!!field.input.value} onChange={field.input.onChange} icons={false}/>
    </div>
);
/* { "LQ": false, "showNotifications": true, "autoPlay": false, "minimizeAtStart": false, "launchOnBalloonClick": true, "enableLog": false, "theme": "light", "width": 409, "height": 743, "youtubeApiKey": null, "twitchImport": [ "rebelvg" ] }
 */
let timer = null;
const changeValue = (e, value, valueOld) => {

}


const SettingsForm = ({handleSubmit, pristine, reset, submitting, getSettings}, initialValues) => (
    <Form initialValues={initialValues} onSubmit={handleSubmit}>
        <FieldWrapper>
            <Label>LQ</Label>
            <InputWrapper>
                <Field
                    name="LQ"
                    label="LQ"
                    component={renderToggleInput}
                    onChange={(e, v,) => {
                        getSettings(!!v, 'LQ')
                    }}
                />
            </InputWrapper>
        </FieldWrapper>
        <FieldWrapper>
            <Label>Show Notifications</Label>
            <InputWrapper>
                <Field
                    name="showNotifications"
                    component={renderToggleInput}
                    onChange={(e, v,) => {
                        getSettings(!!v, 'showNotifications')
                    }}
                />
            </InputWrapper>
        </FieldWrapper>
        <FieldWrapper>
            <Label>Minimize At Start</Label>
            <InputWrapper>
                <Field
                    name="minimizeAtStart"
                    component={renderToggleInput}
                    onChange={(e, v,) => {
                        getSettings(!!v, 'minimizeAtStart')
                    }}
                />
            </InputWrapper>
        </FieldWrapper>
        <FieldWrapper>
            <Label>Launch On Balloon Click</Label>
            <InputWrapper>
                <Field
                    name="launchOnBalloonClick"
                    component={renderToggleInput}
                    onChange={(e, v,) => {
                        getSettings(!!v, 'launchOnBalloonClick')
                    }}
                />
            </InputWrapper>
        </FieldWrapper>

        <FieldWrapper full>
            <Label>Youtube Api Key</Label>
            <InputWrapper>
                <InputField
                    name="youtubeApiKey"
                    component="input"
                    type="text"
                />
            </InputWrapper>
        </FieldWrapper>

        <div>
            <button type="submit" disabled={pristine || submitting}>
                Submit
            </button>
        </div>
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
})(SettingsForm)