import React from 'react';
import styled, { keyframes } from 'styled-components';
import Icon from 'react-icons-kit';
import { loadC } from 'react-icons-kit/ionicons/loadC';
import { getVersion } from 'src/Channel/Helpers/IPCHelpers';

const version = getVersion();

const Loading = () => (
  <LoadingWrapper>
    <LoadingIcon icon={loadC} />
    <LoadingText>Initializing Client</LoadingText>
    <Version>Kolpaque Client {version}</Version>
  </LoadingWrapper>
);

export default Loading;

const LoadingWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const LoadingText = styled.div`
  font-weight: bold;
`;

const rotate360 = keyframes`
	from {transform: rotate(0deg);}
    to {transform: rotate(360deg);}
`;

const LoadingIcon = styled(Icon)`
  color: #347eff;
  animation: ${rotate360} 2s linear infinite;
  margin-bottom: 50px;
  & > svg {
    width: 60px;
    height: 60px;
  }
`;

const Version = styled.div`
  font-size: 12px;
  position: absolute;
  bottom: 22px;
`;
