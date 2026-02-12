import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { Field, FormRenderProps } from 'react-final-form';
import Toggle from 'react-toggle-button';
import styled from 'styled-components';
import Select from 'react-select';
import { openMenu } from '../../Channel/constants';
import { Integrations, Settings } from '../../Shared/types';

const { shell, ipcRenderer } = window.require('electron');

const sortTypes = [
  { value: 'lastAdded', label: 'Last Added' },
  { value: 'lastUpdated', label: 'Last Changed Status' },
  { value: 'service_visibleName', label: 'By Service and Name' },
  { value: 'visibleName', label: 'By Name' },
];

interface ToggleAdapterProps {
  input: {
    name: string;
    value: any;
    onBlur: (...args: any[]) => void;
    onChange: (...args: any[]) => void;
    onFocus: (...args: any[]) => void;
  };
  toggle: (value: boolean, name: string) => void;
}

export const ToggleAdapter: FunctionComponent<ToggleAdapterProps> = ({
  input: { onChange, name, value },
  toggle,
  ...rest
}) => (
  <Toggle
    value={value}
    onToggle={(value) => {
      toggle(!value, name);
      onChange(!value);
    }}
    inactiveLabel={''}
    activeLabel={''}
    {...rest}
  />
);

const ToggleAdapterField = ToggleAdapter as any;

type ReactSelectAdapterProps = {
  input: {
    name: string;
    value: any;
    onBlur: (...args: any[]) => void;
    onChange: (...args: any[]) => void;
    onFocus: (...args: any[]) => void;
  };
  select: (value: string, name: string) => void;
  options: { value: string; label: string }[];
};

const ReactSelectAdapter = ({ input, select, ...rest }: ReactSelectAdapterProps) => (
  <Select
    {...input}
    {...rest}
    onChange={(selected) => {
      input.onChange(selected.value);
      select(selected.value, input.name);
    }}
    clearable={false}
    searchable={false}
  />
);

type SettingsFormProps = FormRenderProps & {
  changeSetting: (value: unknown, name: string, text?: boolean) => void;
  integrations: Integrations;
};

const SettingsForm: FunctionComponent<SettingsFormProps> = ({
  handleSubmit,
  changeSetting,
  integrations,
}) => {
  return (
    <Form onSubmit={handleSubmit}>
      <FieldWrapper>
        <Label>LQ</Label>
        <InputWrapper>
          <Field name="LQ" component={ToggleAdapterField} toggle={changeSetting} />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Show Notifications</Label>
        <InputWrapper>
          <Field
            name="showNotifications"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Show Channel Notifications Only Pinned</Label>
        <InputWrapper>
          <Field
            name="showNotificationsOnlyFavorites"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Enable Notification Sounds</Label>
        <InputWrapper>
          <Field
            name="enableNotificationSounds"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Start Minimized</Label>
        <InputWrapper>
          <Field
            name="minimizeAtStart"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Handle Notification Click</Label>
        <InputWrapper>
          <Field
            name="launchOnBalloonClick"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Night Mode</Label>
        <InputWrapper>
          <Field
            name="nightMode"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Confirm Auto-Start</Label>
        <InputWrapper>
          <Field
            name="confirmAutoStart"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <FieldWrapper>
        <Label>Play In Window</Label>
        <InputWrapper>
          <Field
            name="playInWindow"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <br />

      <SelectWrapper>
        <Label>Sort Mode</Label>
        <SelectField
          name="sortType"
          component={ReactSelectAdapter}
          options={sortTypes}
          select={changeSetting}
        />
      </SelectWrapper>

      <FieldWrapper>
        <Label>Reversed Sort</Label>
        <InputWrapper>
          <Field
            name="sortReverse"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      {/* <FieldWrapper>
        <Label>
          Youtube{' '}
          <Link
            onClick={(e) => {
              e.preventDefault();

              shell.openExternal(`https://www.youtube.com/t/terms`);
            }}
            to="/"
          >
            Terms Of Use
          </Link>{' '}
          Consent
        </Label>
        <InputWrapper>
          <Field
            name="youtubeTosConsent"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper> */}

      <FieldWrapper>
        <Label>Use Streamlink To Check Custom Channels</Label>
        <InputWrapper>
          <Field
            name="useStreamlinkForCustomChannels"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      {/* <FieldWrapper>
        <Label>Enable Channels Sync (encrypted locally)</Label>
        <InputWrapper>
          <Field
            name="enableSync"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper> */}

      <br />

      <InputWrapper>
        <Label>{'Custom RTMP Client Command'}</Label>
        <StyledField
          name="customRtmpClientCommand"
          type="text"
          component="input"
          placeholder="streamlink {{RTMP_URL}} best"
          onContextMenu={() => {
            openMenu();
          }}
          onChange={(event) => {
            changeSetting(event.target.value, 'customRtmpClientCommand', true);
          }}
        />
      </InputWrapper>

      <br />

      <FieldWrapper>
        <Label>Enable Twitch Import</Label>
        <InputWrapper>
          <Field
            name="enableTwitchImport"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>

      <br />

      <button
        onClick={() => {
          ipcRenderer.send('twitch_login');
        }}
      >
        Twitch Login
      </button>

      <Label>
        {
          'Features: live-stream notifications, import followed channels into client.'
        }
        <br />
        Status:{' '}
        {integrations.twitch !== null
          ? integrations.twitch
            ? 'Token valid.'
            : 'Token failed, check logs.'
          : 'Checking integration...'}
      </Label>

      {/* <button
        onClick={() => {
          ipcRenderer.send('kick_login');
        }}
      >
        Kick Login
      </button>

      <Label>
        {'Features: live-stream notifications.'}
        <br />
        Status:{' '}
        {integrations.kick !== null
          ? integrations.kick
            ? 'Token valid.'
            : 'Token failed, check logs.'
          : 'Checking integration...'}
      </Label> */}

      {/* <button
        onClick={() => {
          ipcRenderer.send('klpq_login');
        }}
      >
        KLPQ Login
      </button> */}

      {/* <Label>
        {'Features: backup settings and channels.'}
        <br />
        Status:{' '}
        {integrations.klpq !== null
          ? integrations.klpq
            ? 'Token valid.'
            : 'Token failed, check logs.'
          : 'Checking integration...'}
      </Label> */}

      {/* <br />
      <br /> */}

      {/* <InputWrapper>
        <StyledField
          name="syncId"
          type="text"
          component="input"
          placeholder="Sync Key..."
          onContextMenu={() => {
            openMenu();
          }}
          onChange={(event) => {
            changeSetting(event.target.value, 'syncId', true);
          }}
        />
      </InputWrapper> */}
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SelectWrapper = styled.div`
  margin: 2px 20px;
`;

const SelectField = styled(Field)`
  margin-bottom: 20px;
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.full ? 'column' : 'row')};
  justify-content: space-between;
  margin: 2px 20px;
`;

const Label = styled.label`
  font-weight: bold;
  font-size: 15px;
  color: ${(props) => props.theme.client.color};
  padding-bottom: 10px;
`;

const InputWrapper = styled.div``;

const StyledField = styled(Field)`
  width: 100%;
  height: 18px;
  padding: 0px;
  margin: 0px;
  position: relative;
  z-index: 100000;
`;

export default SettingsForm;
