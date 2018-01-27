import React, {Component} from 'react';
import styled from 'styled-components'
import Select from 'react-select';
import SettingsForm from '../../Forms/SettingsForm/SettingsForm'
import ImportForm from '../../Forms/ImportForm/ImportForm'
import 'react-select/dist/react-select.css';
import theme from '../../../theme'

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

    getSetting = (value, name, text = false) => {
        if (!text) {
            value = value ? value : false;
        } else {
            value = value ? value : '';
        }

        this.props.changeSettings(name, value);
    }

    onSettingsSubmit = (values) => {

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
                    && <SettingsForm initialValues={settings}
                                     enableReinitialize={true}
                                     getSettings={this.getSetting}
                                     onSubmit={this.onSettingsSubmit}/>
                }
                {
                    activeKey === 'import'
                    && <ImportForm onChange={this.submitImports}
                                   members={settings.twitchImport}
                                   getSettings={this.getSetting}
                                   importChannel={this.importChannel}
                                   onSubmit={this.onSettingsSubmit}/>
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