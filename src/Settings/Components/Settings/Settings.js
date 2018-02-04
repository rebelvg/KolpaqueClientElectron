import React, {Component} from 'react';
import styled from 'styled-components'
import Select from 'react-select';
import SettingsForm from '../../Forms/SettingsForm'
import ImportForm from '../../Forms/ImportForm'
import 'react-select/dist/react-select.css';
import {Form} from 'react-final-form'

const options = [
    {value: 'general', label: "General Settings"},
    {value: 'import', label: "Import Settings"},
]


export default class Settings extends Component {
    constructor() {
        super();
        this.state = {
            activeKey: "general"
        }
    }

    changeWindow = (selected) => {
        this.setState({
            activeKey: selected.value
        })
    }

    submitImports = (members) => {
        this.props.changeSettings('twitchImport', members)
    }

    importChannel = (name) => this.props.importChannel(name)


    changeSetting = (value, name, text = false) => {
        if (!text) {
            value = value ? value : false;
        } else {
            value = value ? value : '';
        }

        this.props.changeSettings(name, value);
    }

    submit = (values) => values;

    render() {
        const {settings} = this.props;
        const {activeKey} = this.state;

        return (
            <Container>
                <SettingSelect
                    name="form-field-name"
                    value={activeKey}
                    options={options}
                    onChange={this.changeWindow}
                    clearable={false}
                />

                {
                    activeKey === 'general'
                    && <Form
                        onSubmit={this.submit}
                        changeSetting={this.changeSetting}
                        initialValues={settings}
                        render={(props) => <SettingsForm {...props}/>}
                    />
                }
                {
                    activeKey === 'import'
                    && <Form
                        members={settings.twitchImport}
                        onSubmit={this.submit}
                        submit={this.submitImports}
                        importChannel={this.importChannel}
                        render={(props) => <ImportForm {...props}/>}
                    />
                }
            </Container>
        )
    }
}

const SettingSelect = styled(Select)`
    margin-bottom: 10px;
`;

const Container = styled.div`
    width: 100%;
    height: 100%;
    background-color: ${props => props.theme.channel.bg}
`