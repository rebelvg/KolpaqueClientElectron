import React, {Component} from 'react';
import Ionicon from 'react-ionicons';
import {TABS} from '../../constants';
import styled from 'styled-components';
import theme from '../../../theme';


class Tabs extends Component {
    constructor() {
        super();
    }

    isActive = (active, value) => this.props.isActive(active, value)
    onChange = (value) => this.props.onChange(value)
    getCount = (value) => this.props.getCount(value)

    render() {
        const {getCount, active, onChange, isActive} = this.props;
        return (
            <TabList>
                {TABS.map(tab => (
                    <Tab active={this.isActive(active, tab.value)}
                         onClick={() => this.onChange(tab.value)}
                         key={tab.value}
                    >
                        {tab.name} ({this.getCount(tab.value)})
                    </Tab>
                ))}
                <div onClick={() => this.props.sortChannels()}>
                    <Ionicon icon="ion-ios-loop-strong"/>
                </div>
            </TabList>
        )
    }
}

const TabList = styled.div`
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    border-bottom: 1px solid lightgray;
    flex-direction: column;
    align-items: flex-end;
    width: 24px;
    margin-top: 1px;
    position: relative;
    z-index: 1000;
`

const Tab = styled.div`
    user-select: none;
    display: flex;
    justify-content: center;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 12px;
    height: 105px;
    color: ${theme.tab.color};
    outline: 1px solid #979797;
    position: relative;
    cursor: pointer;
    align-items: center;
    box-sizing: content-box;
    ${props => props.active
    ? (`background-color: ${theme.tabSelected.bg}; width: 24px; z-index: 200`)
    : (`background-color: ${theme.tab.bg}; width: 21px;`)}
`

export default Tabs