import React from 'react';
import styled from 'styled-components'
import {playChannel} from '../../Helpers/IPCHelpers'
import {renderIcon, renderAutoRestart, renderAutoStart} from '../../Helpers/IconRender'
import EditForm from '../../Forms/EditForm/EditForm'
import theme from '../../../theme'


const Channel = ({channel, pinned, handleClick, editMode, selected, renameChannel, selectChannel, changeSetting}) => (
    <ChannelWrapper

        onMouseDown={(e) => {
            if (!e.target.name) {
                selectChannel(e, channel)
            }
        }}
        selected={selected}

        onContextMenu={(e) => {
            if (!e.target.name) {
                handleClick(channel)
            }
        }}
        pinned={pinned}>
        <ChannelData onDoubleClick={() => !editMode && playChannel(channel)}>
            <StyledIcon> {renderIcon(!!channel.service && channel.service)} </StyledIcon>
            {editMode ? ( <EditForm onSubmit={renameChannel}
                                    channel={channel}
                                    nameChange={renameChannel}/>
            ) : (<StyledName>{channel.visibleName || channel.link} </StyledName>)
            }
        </ChannelData>
        <Icons>
            {renderAutoRestart(channel)}
            {renderAutoStart(channel)}
        </Icons>
    </ChannelWrapper>
);


const ChannelWrapper = styled.div`
    display: flex;
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