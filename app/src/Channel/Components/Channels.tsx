import React, { PureComponent } from 'react';
import styled from 'styled-components';
import ChannelItem from '../../Channel/Components/Channel';
import {
  changeChannelSetting,
  openChannelMenu,
} from '../../Channel/Helpers/IPCHelpers';
import { ActionPayloadMap, ActionType, Channel } from '../../Shared/types';

interface ChannelsProps {
  channels: Channel[];
}

interface ChannelsState {
  selected: Channel | null;
  editId: string | null;
}

class Channels extends PureComponent<ChannelsProps, ChannelsState> {
  constructor(props: ChannelsProps) {
    super(props);

    this.state = {
      selected: null,
      editId: null,
    };
  }

  edit = (id: string) => {
    this.setState({ editId: id });
  };

  openMenu = (channel: Channel) => {
    openChannelMenu(channel.id, () => {
      this.edit(channel.id);
    });
  };

  renameChannel = (name: string, id: string) => {
    changeChannelSetting(id, 'visibleName', name);

    this.setState({ editId: null });
  };

  selectChannel = (button: number, channel: Channel) => {
    const { selected } = this.state;

    if (selected && channel.id === selected.id && button === 0) {
      this.setState({ selected: null });
    } else {
      if (button !== 1) {
        this.setState({ selected: channel });
      }
    }
  };

  handleAction = <T extends ActionType>(type: T, data: ActionPayloadMap[T]) => {
    switch (type) {
      case 'RENAME': {
        const [name, id] = data as ActionPayloadMap['RENAME'];

        this.renameChannel(name, id);
        break;
      }
      case 'OPEN_MENU': {
        const [channel] = data as ActionPayloadMap['OPEN_MENU'];

        this.openMenu(channel);
        break;
      }
      case 'SELECT': {
        const [button, channel] = data as ActionPayloadMap['SELECT'];

        this.selectChannel(button, channel);
        break;
      }
      default:
        break;
    }
  };

  render() {
    const { channels } = this.props;
    const { editId, selected } = this.state;

    return (
      <ChannelWrap>
        {channels.map((channel) => (
          <ChannelItem
            key={channel.id}
            handleAction={this.handleAction}
            editMode={editId === channel.id}
            selected={selected?.link === channel.link}
            channel={channel}
          />
        ))}
      </ChannelWrap>
    );
  }
}

export default Channels;

const ChannelWrap = styled.div`
  color: black;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  flex: 1;
  min-height: 0;
  /* hide scrollbar but keep scrolling */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;
