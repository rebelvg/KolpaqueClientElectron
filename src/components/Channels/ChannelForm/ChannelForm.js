import React from 'react';
import Ionicon from 'react-ionicons'
import styled from 'styled-components'


const ChannelForm = ({channel}) => (
    <div>
        <StyledChannelFormWrap>
            <StyledInput type="text"/>
            <StyledIcon fontSize="24px" icon="ion-plus"/>
        </StyledChannelFormWrap>
    </div>
);

const StyledChannelFormWrap = styled.div`
    display: flex;
    align-items: center;
`;

const StyledInput = styled.input`
    flex-grow:2;
    width: 100%;
    display: flex;
        background-color: #fff;
    background-image: none;
    background-clip: padding-box;
    height: 24px;
   border: none;
   border-top: 1px solid lightgray;
   box-shadow: none;
   box-sizing: border-box;
`;

const StyledIcon = styled(Ionicon)`
  background-color:white;
  color:white;
  display: flex;
  box-sizing: border-box;
  border: 1px solid lightgray;

  font-size:24px;
`;


export default ChannelForm;