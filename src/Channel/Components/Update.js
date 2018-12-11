import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { getUpdate, sendInfo } from 'src/redux/channel';

@connect(
  state => ({
    update: getUpdate(state)
  }),
  { sendInfo }
)
export default class Update extends Component {
  constructor() {
    super();
  }

  sendInfo = info => this.props.sendInfo(info);

  render() {
    const { update } = this.props;
    return (
      <div>
        {update && (
          <UpdateWrapper
            onClick={() => {
              this.sendInfo(update);
            }}
          >
            {update}
          </UpdateWrapper>
        )}
      </div>
    );
  }
}

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
  border: 1px solid ${props => props.theme.outline};
  cursor: pointer;
  background-color: ${props => props.theme.clientSecondary.bg};
`;

const FooterWrapper = styled.div`
  background-color: ${props => props.theme.client.bg};
  color: white;
  position: fixed;
  bottom: 0px;
  width: 100%;
  z-index: 3;
`;
