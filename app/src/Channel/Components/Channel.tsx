import React, { PureComponent } from 'react';
import styled, { withTheme } from 'styled-components';

import {
  playChannel,
  changeChannelSetting,
} from '../../Channel/Helpers/IPCHelpers';
import EditForm from '../../Channel/Forms/EditForm';
import {
  AutoStart,
  AutoRestart,
  ServiceIcon,
  PinButton,
} from '../../Shared/Icons';
import {
  ActionPayloadMap,
  ActionType,
  Channel as ChannelType,
} from '../../Shared/types';

interface ChannelProps {
  channel: ChannelType;
  pinned?: boolean;
  editMode?: boolean;
  selected?: boolean;
  handleAction: <T extends ActionType>(
    type: T,
    data: ActionPayloadMap[T],
  ) => void;
}

@withTheme
class Channel extends PureComponent<ChannelProps> {
  contextMenu = (name: string, channel: ChannelType) =>
    !name && this.props.handleAction('OPEN_MENU', [channel]);

  selectChannel = (name: string, which: number, channel: ChannelType) =>
    !name && this.props.handleAction('SELECT', [which, channel]);

  renameChannel = (value: string, id: string) =>
    this.props.handleAction('RENAME', [value, id]);

  changeSetting = (id: string, name: keyof ChannelType, value: boolean) => {
    changeChannelSetting(id, name, value);
  };

  render() {
    const { channel, pinned, editMode, selected } = this.props;

    return (
      <ChannelWrapper
        onMouseDown={({ target: { name }, button }) =>
          this.selectChannel(name, button, channel)
        }
        selected={selected}
        onContextMenu={({ target: { name } }) =>
          this.contextMenu(name, channel)
        }
        pinned={pinned}
      >
        <ChannelData onDoubleClick={() => !editMode && playChannel(channel)}>
          <StyledIcon>
            <ServiceIcon service={channel.service} />
          </StyledIcon>

          {editMode ? (
            <EditForm channel={channel} nameChange={this.renameChannel} />
          ) : (
            <StyledName title={`${channel.visibleName} (${channel.link})`}>
              {/*{channel.isPinned && <Pinned/>}*/}
              {channel.visibleName || channel.link}{' '}
            </StyledName>
          )}
        </ChannelData>

        <Icons>
          <AutoRestart toggle={this.changeSetting} channel={channel} />
          <AutoStart toggle={this.changeSetting} channel={channel} />
          <PinButton toggle={this.changeSetting} channel={channel} />
        </Icons>
      </ChannelWrapper>
    );
  }
}

const ChannelWrapper = styled.div`
  display: flex;
  user-select: none;
  cursor: pointer;
  align-items: center;
  padding: 2px 0px;
  font-weight: bold;
  flex-direction: row;
  font-size: 14px;
  height: 20px;
  background-color: ${(props) =>
    !props.selected
      ? `${props.theme.channel.bg}`
      : `${props.theme.channelSelected.bg}`};
  border-bottom: 1px solid ${(props) => props.theme.outline};
`;

const Icons = styled.div`
  display: flex;
  height: 20px;
  flex-direction: row-reverse;
`;

const ChannelData = styled.div`
  flex-grow: 2;
  display: flex;
  color: ${(props) => props.theme.channel.color};
  flex-direction: row;
`;

const StyledIcon = styled.div`
  margin-right: 5px;
  display: flex;
  align-items: center;
  margin-left: 5px;
  height: 20px;
`;

const StyledName = styled.div`
  flex-grow: 2;
  height: 20px;
  font-size: 14px;
  display: flex;
  color: ${(props) => props.theme.channel.color};
  align-items: center;
  font-weight: bold;
  overflow: hidden;
  width: 10px;
  white-space: nowrap;
`;

export default Channel;
