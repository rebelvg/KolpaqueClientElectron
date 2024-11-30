import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { Field } from 'react-final-form';
import Toggle from 'react-toggle-button';
import styled from 'styled-components';
import Select from 'react-select';
import { openMenu } from '../../Channel/constants';

const { shell, ipcRenderer } = window.require('electron');

const sortTypes = [
  { value: 'lastAdded', label: 'Last Added' },
  { value: 'lastUpdated', label: 'Last Changed Status' },
  { value: 'service_visibleName', label: 'By Service and Name' },
  { value: 'visibleName', label: 'By Name' },
];

export const ToggleAdapter: FunctionComponent<any> = ({
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

const ReactSelectAdapter = ({ input, select, ...rest }) => (
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

const SettingsForm: FunctionComponent<any> = ({
  handleSubmit,
  changeSetting,
  initialValues,
  integrations,
}) => {
  return (
    <Form onSubmit={handleSubmit}>
      <FieldWrapper>
        <Label>LQ</Label>
        <InputWrapper>
          <Field name="LQ" component={ToggleAdapter} toggle={changeSetting} />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Show Notifications</Label>
        <InputWrapper>
          <Field
            name="showNotifications"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Enable Notification Sounds</Label>
        <InputWrapper>
          <Field
            name="enableNotificationSounds"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Start Minimized</Label>
        <InputWrapper>
          <Field
            name="minimizeAtStart"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Handle Notification Click</Label>
        <InputWrapper>
          <Field
            name="launchOnBalloonClick"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Night Mode</Label>
        <InputWrapper>
          <Field
            name="nightMode"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Confirm Auto-Start</Label>
        <InputWrapper>
          <Field
            name="confirmAutoStart"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Play In Window</Label>
        <InputWrapper>
          <Field
            name="playInWindow"
            component={ToggleAdapter}
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
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
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
      </FieldWrapper>
      <FieldWrapper>
        <Label>Use Streamlink To Check Custom Channels</Label>
        <InputWrapper>
          <Field
            name="useStreamlinkForCustomChannels"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
      <FieldWrapper>
        <Label>Enable Channels Sync (encrypted locally)</Label>
        <InputWrapper>
          <Field
            name="enableSync"
            component={ToggleAdapter}
            toggle={changeSetting}
          />
        </InputWrapper>
      </FieldWrapper>
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

      <button
        onClick={() => {
          ipcRenderer.send('twitch_login');
        }}
      >
        Twitch Login
      </button>

      <Label>
        {'Dependent features: twitch notifications, twitch import.'}
        <br />
        Status:{' '}
        {integrations.twitch !== null
          ? integrations.twitch
            ? 'Token valid'
            : 'Token failed, check logs'
          : 'Checking integration...'}
      </Label>

      <button
        onClick={() => {
          ipcRenderer.send('klpq_login');
        }}
      >
        KLPQ Login
      </button>

      <Label>
        {'Dependent features: klpq sync, youtube notifications.'}
        <br />
        Status:{' '}
        {integrations.klpq !== null
          ? integrations.klpq
            ? 'Token valid'
            : 'Token failed, check logs'
          : 'Checking integration...'}
      </Label>

      <br />
      <br />

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
