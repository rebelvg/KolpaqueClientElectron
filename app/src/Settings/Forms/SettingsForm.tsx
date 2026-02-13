import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { Field, FieldRenderProps, FormRenderProps } from 'react-final-form';
import styled from 'styled-components';
import { openMenu } from '../../Channel/constants';
import { Integrations, Settings } from '../../Shared/types';

const sortTypes = [
  { value: 'lastAdded', label: 'Last Added' },
  { value: 'lastUpdated', label: 'Last Changed Status' },
  { value: 'service_visibleName', label: 'By Service and Name' },
  { value: 'visibleName', label: 'By Name' },
];

type ToggleAdapterProps = FieldRenderProps<boolean> & {
  toggle: (value: boolean, name: string) => void;
};

export const ToggleAdapter: FunctionComponent<ToggleAdapterProps> = ({
  input: { onChange, name, value },
  toggle,
}) => (
  <ToggleTrack
    role="switch"
    aria-checked={!!value}
    tabIndex={0}
    onClick={() => {
      toggle(!value, name);
      onChange(!value);
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(!value, name);
        onChange(!value);
      }
    }}
    $checked={!!value}
  >
    <ToggleThumb $checked={!!value} />
  </ToggleTrack>
);

const ToggleAdapterField = ToggleAdapter;

type NativeSelectAdapterProps = FieldRenderProps<string> & {
  select: (value: string, name: string) => void;
  options: { value: string; label: string }[];
};

const NativeSelectAdapter = ({
  input,
  select,
  options,
}: NativeSelectAdapterProps) => (
  <SelectEl
    name={input.name}
    value={input.value}
    onChange={(event) => {
      const selected = event.target.value;

      input.onChange(selected);
      select(selected, input.name);
    }}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </SelectEl>
);

type SettingsFormProps = FormRenderProps<Settings> & {
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
          <Field
            name="LQ"
            component={ToggleAdapterField}
            toggle={changeSetting}
          />
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
        <Label>Show Notifications Only Pinned Channels</Label>
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
        <Label>Play On Notification Click</Label>
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
          component={NativeSelectAdapter}
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
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
          window.electronAPI.send('twitch_login');
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
        Kolpaque Login
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
  width: 100%;
  display: block;
`;

interface FieldWrapperProps {
  full?: boolean;
}

const FieldWrapper = styled.div<FieldWrapperProps>`
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

const ToggleTrack = styled.div<{ $checked: boolean }>`
  width: 38px;
  height: 20px;
  border-radius: 999px;
  background: ${(props) =>
    props.$checked ? props.theme.clientSecondary.color : props.theme.outline};
  position: relative;
  cursor: pointer;
  transition: background 0.15s ease-out;
  outline: none;
`;

const ToggleThumb = styled.div<{ $checked: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${(props) => props.theme.client.bg};
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$checked ? '20px' : '2px')};
  transition:
    left 0.15s ease-out,
    background 0.15s ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
`;

const SelectEl = styled.select`
  width: 100%;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid ${(props) => props.theme.outline};
  background: ${(props) => props.theme.client.bg};
  color: ${(props) => props.theme.client.color};
  font-size: 14px;
`;

export default SettingsForm;
