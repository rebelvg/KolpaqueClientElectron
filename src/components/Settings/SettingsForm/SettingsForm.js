/**
 * Created by JackP on 10/8/2017.
 */
import React from 'react'
import {Field, reduxForm} from 'redux-form'
import Toggle from 'react-toggle';
import './toggle.css';

const renderToggleInput = (field) => (
    <div>
        <Toggle checked={field.input.value} onChange={field.input.onChange} icons={false}/>
    </div>
);
/* { "LQ": false, "showNotifications": true, "autoPlay": false, "minimizeAtStart": false, "launchOnBalloonClick": true, "enableLog": false, "theme": "light", "width": 409, "height": 743, "youtubeApiKey": null, "twitchImport": [ "rebelvg" ] }
 */


const SettingsForm = ({handleSubmit, pristine, reset, submitting}, initialValues) => (
    <form initialValues={initialValues} onSubmit={handleSubmit}>
        <div>
            <label>LQ</label>
            <div>
                <Field
                    name="LQ"
                    label="LQ"
                    component={renderToggleInput}
                />
            </div>
        </div>
        <div>
            <label>Show Notifications</label>
            <div>
                <Field
                    name="showNotifications"
                    component={renderToggleInput}
                />
            </div>
        </div>
        <div>
            <label>Minimize At Start</label>
            <div>
                <Field
                    name="minimizeAtStart"
                    component={renderToggleInput}
                />
            </div>
        </div>
        <div>
            <label>Launch On Balloon Click</label>
            <div>
                <Field
                    name="launchOnBalloonClick"
                    component={renderToggleInput}
                />
            </div>
        </div>
       
        <div>
            <label>Youtube Api Key</label>
            <div>
                <Field
                    name="employed"
                    component="input"
                    type="text"
                />
            </div>
        </div>

        <div>
            <button type="submit" disabled={pristine || submitting}>
                Submit
            </button>
        </div>
    </form>
)

export default reduxForm({
    form: 'settings' // a unique identifier for this form
})(SettingsForm)