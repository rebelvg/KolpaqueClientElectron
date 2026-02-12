import React, { Component } from 'react';
import styled from 'styled-components';
import { TABS, TabValue } from '../../Channel/constants';
import { ChannelCount } from '../../Shared/types';

interface TabsProps {
  activeTab: TabValue;
  count: ChannelCount;
  handleActiveTab: (activeTab: TabValue) => void | Promise<void>;
}

class Tabs extends Component<TabsProps> {
  onChange = (value: TabValue) => {
    this.props.handleActiveTab(value);
  };

  render() {
    const { activeTab, count } = this.props;

    return (
      <TabList>
        {TABS.map((tab) => (
          <Tab
            active={activeTab === tab.value}
            onClick={() => this.onChange(tab.value)}
            key={tab.value}
          >
            {tab.name} ({count[tab.value]})
          </Tab>
        ))}
      </TabList>
    );
  }
}

const TabList = styled.div`
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 24px;
  margin-top: 1px;
  position: relative;
  z-index: 1000;
`;

interface TabProps {
  active: boolean;
}

const Tab = styled.div<TabProps>`
  user-select: none;
  display: flex;
  justify-content: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 12px;
  height: 105px;
  color: ${(props) => props.theme.tab.color};
  outline: 1px solid ${(props) => props.theme.outline};
  position: relative;
  cursor: pointer;
  align-items: center;
  box-sizing: content-box;
  ${(props) =>
    props.active
      ? `background-color: ${props.theme.tabSelected.bg}; width: 24px; z-index: 200`
      : `background-color: ${props.theme.tab.bg}; width: 20px;`}
`;

export default Tabs;
