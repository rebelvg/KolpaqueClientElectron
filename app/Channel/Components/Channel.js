import React, { PureComponent } from 'react';
import styled, { withTheme } from 'styled-components';

import { playChannel, changeSetting } from 'src/Channel/Helpers/IPCHelpers';
import EditForm from 'src/Channel/Forms/EditForm';
import {
  AutoStart,
  AutoRestart,
  Pinned,
  ServiceIcon,
  PinButton,
} from 'src/Shared/Icons';

@withTheme
class Channel extends PureComponent {
  constructor() {
    super();
  }

  contextMenu = (name, channel) =>
    !name && this.props.handleAction('OPEN_MENU', [channel]);

  selectChannel = (name, which, channel) =>
    !name && this.props.handleAction('SELECT', [which, channel]);

  renameChannel = (value, id) => this.props.handleAction('RENAME', [value, id]);

  changeSetting = (id, name, value) => {
    changeSetting(id, name, value);
  };

  render() {
    const { channel, pinned, editMode, selected, showTooltips } = this.props;

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
            <EditForm
              onSubmit={this.renameChannel}
              channel={channel}
              nameChange={this.renameChannel}
            />
          ) : (
            <StyledName
              title={
                showTooltips ? `${channel.visibleName} (${channel.link})` : ''
              }
            >
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
  background-color: ${props =>
    !props.selected
      ? `${props.theme.channel.bg}`
      : `${props.theme.channelSelected.bg}`};
  border-bottom: 1px solid ${props => props.theme.outline};
`;

const Icons = styled.div`
  display: flex;
  height: 20px;
  flex-direction: row-reverse;
`;

const ChannelData = styled.div`
  flex-grow: 2;
  display: flex;
  color: ${props => props.theme.channel.color};
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
  color: ${props => props.theme.channel.color};
  align-items: center;
  font-weight: bold;
  overflow: hidden;
  width: 10px;
  white-space: nowrap;
`;

export default Channel;
