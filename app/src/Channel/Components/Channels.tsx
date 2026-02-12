import React, { PureComponent } from 'react';
import styled from 'styled-components';
import ChannelItem from '../../Channel/Components/Channel';
import {
  changeChannelSetting,
  openChannelMenu,
} from '../../Channel/Helpers/IPCHelpers';
import ReactList from 'react-list';
import { ActionPayloadMap, ActionType, Channel } from '../../Shared/types';

interface ChannelsProps {
  channels: Channel[];
}

interface ChannelsState {
  selected: Channel | null;
  edit: Channel | null;
}

class Channels extends PureComponent<ChannelsProps, ChannelsState> {
  constructor(props: ChannelsProps) {
    super(props);

    this.state = {
      selected: null,
      edit: null,
    };
  }

  edit = (channel: Channel) => {
    this.setState({ edit: channel });
  };

  openMenu = (channel: Channel) => {
    openChannelMenu(channel, () => this.edit(channel));
  };

  renameChannel = (name: string, id: string) => {
    changeChannelSetting(id, 'visibleName', name);

    this.setState({ edit: null });
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
    const { edit, selected } = this.state;

    return (
      <ChannelWrap isUpdate={false}>
        <ReactList
          type={'uniform'}
          length={channels.length}
          useStaticSize={true}
          threshold={500}
          itemRenderer={(index) => {
            const channel = channels[index];

            if (!channel) {
              return null;
            }

            return (
              <div key={channel.id}>
                <ChannelItem
                  handleAction={this.handleAction}
                  editMode={edit?.id === channel.id}
                  selected={selected?.link === channel.link}
                  channel={channel}
                />
              </div>
            );
          }}
        />
      </ChannelWrap>
    );
  }
}

export default Channels;

const ChannelWrap = styled.div`
  color: black;
  overflow: auto;
  height: 100%;
`;
