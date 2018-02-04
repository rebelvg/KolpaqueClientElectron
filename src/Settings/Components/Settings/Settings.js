import React, {Component} from 'react';
import styled from 'styled-components'
import Select from 'react-select';
import SettingsForm from '../../Forms/SettingsForm/SettingsForm'
import ImportForm from '../../Forms/ImportForm/ImportForm'
import 'react-select/dist/react-select.css';
import theme from '../../../theme'
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

    submitImports = (twitchImports) => {
        this.props.changeSettings('twitchImport', twitchImports)
    }

    importChannel = (name) => {
        this.props.importChannel(name)
    }

    changeSetting = (value, name, text = false) => {
        console.log(value, name)
        if (!text) {
            value = value ? value : false;
        } else {
            value = value ? value : '';
        }

        this.props.changeSettings(name, value);
    }

    submit = (values) => {
    }

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
                    && <ImportForm onChange={this.submitImports}
                                   members={settings.twitchImport}
                                   getSettings={this.changeSetting}
                                   importChannel={this.importChannel}
                                   onSubmit={this.submit}/>
                }
            </Container>
        )
    }
}

const SettingSelect = styled(Select)`
    margin-bottom: 10px;
`;
const PageTitle = styled.h4`
    padding: 5px 0px;
    margin: 0px;
    background-color: #D7D7D7;
    text-align: center;
`
const Container = styled.div`
    width: 100%;
    height: 100%;
    background-color: ${props => props.theme.channel.bg}
`
