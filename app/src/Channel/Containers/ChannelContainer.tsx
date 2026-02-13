import React, { PureComponent } from 'react';
import Icon from 'react-icons-kit';
import { cog } from 'react-icons-kit/fa/cog';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form } from 'react-final-form';
import Update from '../../Channel/Components/Update';
import SearchForm from '../../Channel/Forms/SearchForm/SearchForm';
import Footer from '../../Channel/Components/Footer';
import Tabs from '../../Channel/Components/Tabs';
import Channels from '../../Channel/Components/Channels';
import { getChannels } from '../Helpers/IPCHelpers';

import { Channel, ChannelCount } from '../../Shared/types';

interface ChannelContainerProps {
  filter?: string;
  updateNotification?: string;
}

interface ChannelContainerState {
  selected: Channel | null;
  editChannel: Channel | null;
  channels: Channel[];
  activeTab: 'online' | 'offline';
  filter: string;
  count: ChannelCount;
}

class ChannelContainer extends PureComponent<
  ChannelContainerProps,
  ChannelContainerState
> {
  private cleanupFns: Array<() => void> = [];

  constructor(props: ChannelContainerProps) {
    super(props);

    this.state = {
      selected: null,
      editChannel: null,
      channels: [],
      activeTab: 'online',
      filter: '',
      count: { online: 0, offline: 0 },
    };
  }

  private updateView = async (caller: string, args?: unknown) => {
    const { activeTab, filter } = this.state;

    const { channels, count } = await getChannels(
      {
        isLive: activeTab === 'online',
        filter,
      },
      `${caller} ${JSON.stringify(args)}`,
    );

    this.setState({
      channels,
      count,
    });
  };

  async componentDidMount() {
    this.cleanupFns = [
      window.electronAPI.on('channel_changeSetting_api', () => {
        this.updateView('channel_changeSetting_api');
      }),
      window.electronAPI.on('runChannelUpdates', (_event, args) => {
        this.updateView('runChannelUpdates', args);
      }),
      window.electronAPI.on('channel_removeSync', () => {
        this.updateView('channel_removeSync');
      }),
    ];

    await this.updateView('componentDidMount');
  }

  componentWillUnmount() {
    this.cleanupFns.forEach((fn) => fn());
  }

  setFilter = async (value: { filter?: string }) => {
    const { activeTab } = this.state;

    const filter = value.filter ? value.filter : '';

    const { channels, count } = await getChannels(
      {
        isLive: activeTab === 'online',
        filter,
      },
      'filter',
    );

    this.setState({
      channels,
      count,
      filter,
    });
  };

  handleActiveTab = async (activeTab: ChannelContainerState['activeTab']) => {
    const { filter } = this.state;

    const { channels, count } = await getChannels(
      {
        isLive: activeTab === 'online',
        filter,
      },
      'handleActiveTab',
    );

    this.setState({
      channels,
      count,
      activeTab,
    });
  };

  render() {
    const { filter, updateNotification } = this.props;
    const { channels, count, activeTab } = this.state;

    return (
      <Wrapper>
        <ChannelSearchForm
          onSubmit={this.setFilter}
          initialValues={{ filter }}
          render={(props) => <SearchForm {...props} save={this.setFilter} />}
          subscription={{}}
        />

        <ContainerWrapper>
          <TabWrapper>
            <Tabs
              handleActiveTab={this.handleActiveTab}
              activeTab={activeTab}
              count={count}
            />
            <SettingsIcon to="/about">
              <CogIcon icon={cog} size={18} />
            </SettingsIcon>
          </TabWrapper>

          <TabPanel updateNotification={updateNotification}>
            <Channels channels={channels} />
          </TabPanel>
          <Update updateNotification={updateNotification} />
          <Footer />
        </ContainerWrapper>
      </Wrapper>
    );
  }
}

const ChannelSearchForm = styled(Form)``;

const CogIcon = styled(Icon)`
  color: ${(props) => props.theme.clientSecondary.color};
  padding-left: 1px;
`;

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: 48px;
`;

interface TabPanelProps {
  updateNotification?: string;
}

const TabPanel = styled.div<TabPanelProps>`
  width: 100%;
  padding-bottom: ${({ updateNotification }) =>
    updateNotification ? 28 : 0}px;
  display: block;
  max-height: 100vh;
  margin-right: 3px;
  background-color: ${(props) => props.theme.clientSecondary.bg};
  border: 1px solid ${(props) => props.theme.outline};
  border-left: none;
`;

const SettingsIcon = styled(Link)`
  display: flex;
  justify-content: center;
`;

const ContainerWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.theme.client.bg};
`;

const TabWrapper = styled.div`
  height: 100%;
  background-color: ${(props) => props.theme.client.bg};
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  border-right: 1px solid ${(props) => props.theme.outline};
  position: relative;
  z-index: 2;
  align-items: center;
`;

export default ChannelContainer;
