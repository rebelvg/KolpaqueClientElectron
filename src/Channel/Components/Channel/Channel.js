import React from 'react';
import styled from 'styled-components'
import {renderIcon, renderAutoRestart, renderAutoStart} from '../../Helpers/IconRender'
import EditForm from '../../Forms/EditForm/EditForm'

const Channel = ({channel, pinned, handleClick, editMode, selected, renameChannel, selectChannel, playChannel, changeSetting}) => (
    <ChannelWrapper

        onMouseDown={(e) => selectChannel(e, channel)}
        selected={selected}

        onContextMenu={() => handleClick(channel)}
        pinned={pinned}>
        <ChannelData onDoubleClick={() => playChannel(channel)}>
            <StyledIcon> {renderIcon(!!channel.service && channel.service)} </StyledIcon>
            {editMode ? ( <EditForm onSubmit={renameChannel}
                                    initialValues={channel}
                                    nameChange={renameChannel}/>
            ) : (<StyledName>{channel.visibleName || channel.link} </StyledName>)
            }
        </ChannelData>
        <Icons>
            {renderAutoRestart(channel, changeSetting)}
            {renderAutoStart(channel, changeSetting)}
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
    background-color:  ${props => !props.selected ? 'initial' : '#ece8e8'};
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
    align-items: center;
`;

export default Channel;