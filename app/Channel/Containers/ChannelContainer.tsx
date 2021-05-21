import React, { PureComponent } from 'react';
import Icon from 'react-icons-kit';
import { cog } from 'react-icons-kit/fa/cog';
import { Link } from 'react-router-dom';
import styled, { withTheme } from 'styled-components';
import { Form } from 'react-final-form';
import Update from '../../Channel/Components/Update';
import SearchForm from '../../Channel/Forms/SearchForm/SearchForm';
import Footer from '../../Channel/Components/Footer';
import Tabs from '../../Channel/Components/Tabs';
import Loading from '../../Shared/Loading';
import Channels from '../../Channel/Components/Channels';
import { getChannels } from '../Helpers/IPCHelpers';

import { IpcRenderer } from 'electron';

const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.require(
  'electron',
);

@withTheme
class ChannelContainer extends PureComponent<any, any> {
  constructor(props) {
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

  private updateView = async (caller: string) => {
    console.log('updateView', caller);

    const { activeTab, filter } = this.state;

    const { channels, count } = await getChannels(
      {
        isLive: activeTab === 'online',
        filter,
      },
      caller,
    );

    this.setState({
      channels,
      count,
    });
  };

  async componentDidMount() {
    console.log('componentDidMount_channel');

    ipcRenderer.on('channel_changeSettingSync', () => {
      this.updateView('channel_changeSettingSync');
    });
    ipcRenderer.on('channel_addSync', () => {
      this.updateView('channel_addSync');
    });
    ipcRenderer.on('channel_removeSync', () => {
      this.updateView('channel_removeSync');
    });

    await this.updateView('componentDidMount');
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('channel_changeSettingSync');
    ipcRenderer.removeAllListeners('channel_addSync');
    ipcRenderer.removeAllListeners('channel_removeSync');
  }

  setFilter = async (value) => {
    const { activeTab } = this.state;

    console.log(value);

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

  handleActiveTab = async (activeTab) => {
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
    const { filter } = this.props;
    const { channels, count, activeTab } = this.state;

    console.log('render');

    return (
      <Wrapper>
        <ChannelSearchForm
          onSubmit={this.setFilter}
          save={this.setFilter}
          initialValues={{ filter }}
          render={(props) => <SearchForm {...props} />}
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

          <TabPanel>
            <Channels channels={channels} />
          </TabPanel>
          <Update />
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

const TabPanel = styled.div`
  width: 100%;
  padding-bottom: ${({ update }) => (update ? 25 : 0)}px;
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
