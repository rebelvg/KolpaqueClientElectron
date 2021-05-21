import React, { PureComponent } from 'react';
import styled, { withTheme } from 'styled-components';
import { connect } from 'react-redux';
import Channel from '../../Channel/Components/Channel';
import { getChannelsList, getUpdate, updateData } from '../../redux/channel';
import {
  changeChannelSetting,
  openChannelMenu,
} from '../../Channel/Helpers/IPCHelpers';
import ReactList from 'react-list';

@withTheme
@connect(
  (state) => ({
    update: getUpdate(state),
    channels: getChannelsList(state),
  }),
  {
    updateData,
  },
)
class Channels extends PureComponent<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      selected: null,
      edit: null,
    };
  }

  edit = (channel) => {
    this.setState({ edit: channel });
  };

  openMenu = (channel) => {
    openChannelMenu(channel, () => this.edit(channel));
  };

  renameChannel = (name, id) => {
    changeChannelSetting(id, 'visibleName', name);

    this.setState({ edit: null });
  };

  selectChannel = (button, channel) => {
    const { selected } = this.state;

    if (selected && channel.id === selected.id && button === 0) {
      this.setState({ selected: null });
    } else {
      if (button !== 1) {
        this.setState({ selected: channel });
      }
    }
  };

  handleAction = (type, data) => {
    const [name, id] = data;

    const actions = {
      RENAME: () => this.renameChannel(name, id),
      OPEN_MENU: () => this.openMenu(name),
      SELECT: () => this.selectChannel(name, id),
    };

    if (actions[type]) {
      actions[type]();
    }
  };

  render() {
    const { channels, update } = this.props;
    const { edit, selected } = this.state;

    return (
      <ChannelWrap isUpdate={update}>
        <ReactList
          type={'uniform'}
          length={channels.length}
          useStaticSize={true}
          threshold={500}
          itemRenderer={(index) => (
            <div key={channels[index].id}>
              <Channel
                handleAction={this.handleAction}
                editMode={edit && edit.id === channels[index].id}
                selected={selected && selected.link === channels[index].link}
                channel={channels[index]}
              />
            </div>
          )}
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
