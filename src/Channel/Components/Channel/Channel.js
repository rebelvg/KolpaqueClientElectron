import React, {Component} from 'react';
import styled, {withTheme} from 'styled-components';
import {playChannel, changeSetting} from '../../Helpers/IPCHelpers';
import ServiceIcon from '../../../Shared/ServiceIcon'
import AutoRestart from '../../../Shared/AutoRestart'
import AutoStart from '../../../Shared/AutoStart'
import Pinned from '../../../Shared/Pinned'
import EditForm from '../../Forms/EditForm';

@withTheme
class Channel extends Component {
    constructor() {
        super();
    }

    contextMenu = (name, channel) =>
    !name && this.props.handleChannelAction('OPEN_MENU', [channel]);

    selectChannel = (name, which, channel) =>
    !name && this.props.handleChannelAction('SELECT', [which, channel]);

    renameChannel = (value, id) =>
        this.props.handleChannelAction('RENAME', [value, id]);

    changeSetting = (id, name, value) => changeSetting(id, name, value);

    render() {
        const {
            channel,
            pinned,
            editMode,
            selected,
            visible,
            showTooltips
        } = this.props;

        return (
            <ChannelWrapper
                visible={visible}
                onMouseDown={({target: {name}, button}) =>
                    this.selectChannel(name, button, channel)}
                selected={selected}
                onContextMenu={({target: {name}}) =>
                    this.contextMenu(name, channel)}
                pinned={pinned}
            >
                <ChannelData
                    onDoubleClick={() => !editMode && playChannel(channel)}
                >
                    <StyledIcon> <ServiceIcon service={channel.service}/> </StyledIcon>

                    {editMode ? (
                        <EditForm
                            onSubmit={this.renameChannel}
                            channel={channel}
                            nameChange={this.renameChannel}
                        />
                    ) : (
                        <StyledName title={showTooltips ? `${channel.visibleName} (${channel.link})` : ''}>
                            {channel.isPinned && <Pinned/>}{channel.visibleName || channel.link}{' '}
                        </StyledName>
                    )}

                </ChannelData>

                <Icons>
                    <AutoRestart toggle={this.changeSetting} channel={channel}/>
                    <AutoStart toggle={this.changeSetting} channel={channel}/>
                </Icons>

            </ChannelWrapper>
        );
    }
}

const ChannelWrapper = styled.div`
    display: ${({visible}) => (visible ? 'flex' : 'none')};
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
    border-top: 1px solid ${props => props.theme.outline};
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
    overflow: hidden;
`;

export default Channel;
