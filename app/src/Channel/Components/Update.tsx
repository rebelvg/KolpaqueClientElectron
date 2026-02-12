import React, { Component } from 'react';
import styled from 'styled-components';

import { FunctionComponent } from 'react';

interface UpdateProps {
  updateNotification?: string;
}

const Update: FunctionComponent<UpdateProps> = ({ updateNotification }) => {
  const sendInfo = () => {
    window.electronAPI.send('client_getInfo');
  };

  if (!updateNotification) {
    return null;
  }

  return <UpdateWrapper onClick={sendInfo}>{updateNotification}</UpdateWrapper>;
};

export default Update;

const UpdateWrapper = styled.div`
  position: fixed;
  bottom: 23px;
  width: calc(100% - 22px);
  font-size: 14px;
  text-align: center;
  color: #9f2dff;
  text-decoration: underline;
  z-index: 0;
  left: 17px;
  padding: 5px 0px;
  border: 1px solid ${(props) => props.theme.outline};
  cursor: pointer;
  background-color: ${(props) => props.theme.clientSecondary.bg};
`;
