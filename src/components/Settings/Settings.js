import React, {Component} from 'react';
import styled from 'styled-components'
import SettingsForm from './SettingsForm/SettingsForm'

export default class Settings extends Component {
    constructor() {
        super();
    }

    onSettingsChange = () => {

    }

    onSettingsSubmit = (values) => {
        console.log(values)
    }

    render() {
        const {settings} = this.props;
        return (
            <div>
                {JSON.stringify(settings)}
                <h1>Settings Page</h1>
                <SettingsForm initialValues={settings} onSubmit={this.onSettingsSubmit}/>
            </div>
        )
    }
}