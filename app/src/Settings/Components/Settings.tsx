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
import { Integrations, Settings as SettingsType } from '../../Shared/types';

const options = [
  { value: 'general', label: 'General Settings' },
  // { value: 'import', label: 'Import Settings' },
  { value: 'logs', label: 'Logs' },
];

interface SettingsProps {
  settings: SettingsType;
  integrations: Integrations;
  changeSettings: (name: string, value: unknown) => void;
  importChannel: (name: string) => void;
}

interface SettingsState {
  activeKey: 'general' | 'import' | 'logs';
}

export default class Settings extends Component<SettingsProps, SettingsState> {
  constructor(props: SettingsProps) {
    super(props);

    this.state = {
      activeKey: 'general',
    };
  }

  componentDidMount(): void {
    ipcRenderer.send('settings_check_tokens');
  }

  componentDidUpdate(
    prevProps: Readonly<SettingsProps>,
    prevState: Readonly<SettingsState>,
    snapshot?: unknown,
  ): void {
    const { activeKey } = this.state;

    if (prevState.activeKey !== activeKey && activeKey === 'general') {
      ipcRenderer.send('settings_check_tokens');
    }
  }

  changeWindow = (selected: { value: SettingsState['activeKey'] }) => {
    this.setState({
      activeKey: selected.value,
    });
  };

  submitImports = (members: string[]) => {
    this.props.changeSettings('twitchImport', members);
  };

  importChannel = (name: string) => this.props.importChannel(name);

  changeSetting = (value: unknown, name: string, text = false) => {
    if (!text) {
      value = value ? value : false;
    } else {
      value = value ? value : '';
    }

    this.props.changeSettings(name, value);
  };

  submit = (values: SettingsType) => values;

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
            initialValues={{ ...settings }}
            render={(props) => (
              <SettingsForm
                {...props}
                changeSetting={this.changeSetting}
                integrations={integrations}
              />
            )}
          />
        )}

        {activeKey === 'import' && (
          <Form
            onSubmit={this.submit}
            initialValues={{ ...settings }}
            render={(props) => (
              <ImportForm
                {...props}
                members={settings.twitchImport ?? []}
                submit={this.submitImports}
                importChannel={this.importChannel}
              />
            )}
          />
        )}

        {activeKey === 'logs' && (
          <Logs />
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
