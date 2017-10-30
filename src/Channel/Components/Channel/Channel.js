import React, {Component} from 'react';
import styled from 'styled-components'
import {playChannel} from '../../Helpers/IPCHelpers'
import {renderIcon, renderAutoRestart, renderAutoStart} from '../../Helpers/IconRender'
import EditForm from '../../Forms/EditForm/EditForm'
import theme from '../../../theme'
import {FilterChannel} from '../../Helpers/FilterChannels';

const getVisible = (isVisible) => {
    return isVisible ? 'flex' : 'none'
}

const isFiltered = (channel, filter) => FilterChannel(channel, filter)

class Channel extends Component {
    constructor() {
        super();
    }

    handleClick = (name, channel) => !name && this.props.handleClick(channel)
    selectChannel = (name, which, channel) => {
        !name && this.props.selectChannel(which, channel)
    }
    renameChannel = (value, id) => this.props.renameChannel(value, id)
    changeSetting = (id, name, value) => this.props.changeSetting(id, name, value)

    render() {
        const {channel, pinned, editMode, selected, visible, filter, log} = this.props;
        return (
            <ChannelWrapper
                visible={visible && isFiltered(channel, filter)}
                onMouseDown={({target: {name, which}}) => this.selectChannel(name, which, channel)}
                selected={selected}
                onContextMenu={({target: {name}}) => this.handleClick(name, channel)}
                pinned={pinned}>
                <ChannelData onDoubleClick={() => !editMode && playChannel(channel)}>
                    <StyledIcon> {renderIcon(channel.service, log)} </StyledIcon>
                    {editMode ? ( <EditForm onSubmit={this.renameChannel}
                                            channel={channel}
                                            nameChange={this.renameChannel}/>
                    ) : (<StyledName>{channel.visibleName || channel.link} </StyledName>)
                    }
                </ChannelData>
                <Icons>
                    {renderAutoRestart(channel, this.changeSetting, log)}
                    {renderAutoStart(channel, this.changeSetting, log)}
                </Icons>
            </ChannelWrapper>
        )
    }

}

const ChannelWrapper = styled.div`
    display: ${({visible}) => getVisible(visible)};
    user-select: none;
    cursor:pointer;
    align-items: center;
    padding: 2px 0px;
    font-weight: bold;
    flex-direction: row;
    font-size: 14px;
    height: 20px;
    background-color:  ${props => !props.selected ? `${theme.channel.bg}` : `${theme.channelSelected.bg}`};
    border-top: 1px solid #969696;
`;

const Icons = styled.div`
    display: flex;
    height: 20px;
    flex-direction: row-reverse;
`
const ChannelData = styled.div`
    flex-grow: 2;
    display: flex;
    color: ${theme.channel.color};
    flex-direction: row;
`


const StyledIcon = styled.div`
    margin-right: 5px;
    display: flex;
    align-items: center;
    margin-left: 5px;
    height:20px
`;
const FormWrapper = styled.div`
`
const StyledName = styled.div`
    flex-grow: 2;
       height:20px;
           display: flex;
           color: ${theme.channel.color};
    align-items: center;
`;

export default Channel;