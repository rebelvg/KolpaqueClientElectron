import React, { Component } from 'react';
import styled from 'styled-components';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { Form } from 'react-final-form';
import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } =
  window.require('electron');

import SettingsForm from '../../Settings/Forms/SettingsForm';
import ImportForm from '../../Settings/Forms/ImportForm';
import Logs from '../../Settings/Forms/LogsForm';

const options = [
  { value: 'general', label: 'General Settings' },
  // { value: 'import', label: 'Import Settings' },
  { value: 'logs', label: 'Logs' },
];

export default class Settings extends Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      activeKey: 'general',
    };
  }

  componentDidMount(): void {
    ipcRenderer.send('settings_check_tokens');
  }

  componentDidUpdate(
    prevProps: Readonly<any>,
    prevState: Readonly<any>,
    snapshot?: any,
  ): void {
    const { activeKey } = this.state;

    if (prevState.activeKey !== activeKey && activeKey === 'general') {
      ipcRenderer.send('settings_check_tokens');
    }
  }

  changeWindow = (selected) => {
    this.setState({
      activeKey: selected.value,
    });
  };

  submitImports = (members) => {
    this.props.changeSettings('twitchImport', members);
  };

  importChannel = (name) => this.props.importChannel(name);

  changeSetting = (value: any, name: string, text = false) => {
    if (!text) {
      value = value ? value : false;
    } else {
      value = value ? value : '';
    }

    this.props.changeSettings(name, value);
  };

  submit = (values) => values;

  render() {
    const { settings, integrations } = this.props;
    const { activeKey } = this.state;

    return (
      <Container>
        <SettingSelect
          name="form-field-name"
          value={activeKey}
          options={options}
          onChange={this.changeWindow}
          clearable={false}
        />

        {activeKey === 'general' && (
          <Form
            onSubmit={this.submit}
            // @ts-ignore
            changeSetting={this.changeSetting}
            initialValues={{ ...settings }}
            integrations={{ ...integrations }}
            render={(props) => <SettingsForm {...props} />}
          />
        )}

        {activeKey === 'import' && (
          <Form
            // @ts-ignore
            members={settings.twitchImport}
            onSubmit={this.submit}
            submit={this.submitImports}
            importChannel={this.importChannel}
            initialValues={{ ...settings }}
            changeSetting={this.changeSetting}
            render={(props) => <ImportForm {...props} />}
          />
        )}

        {activeKey === 'logs' && (
          // @ts-ignore
          <Form render={(props) => <Logs {...props} />} />
        )}
      </Container>
    );
  }
}

const SettingSelect = styled(Select)`
  margin-bottom: 10px;
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.theme.channel.bg};
  overflow-y: scroll;
`;
