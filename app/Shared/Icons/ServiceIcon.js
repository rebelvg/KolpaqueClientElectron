import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import styled, { withTheme } from 'styled-components';
import { twitch } from 'react-icons-kit/fa/twitch';
import { eye } from 'react-icons-kit/fa/eye';
import { youtubePlay } from 'react-icons-kit/fa/youtubePlay';

const Services = {
  twitch: {
    asset: twitch,
    isImage: false,
    padding: 1,
    color: '#6441a5',
  },
  'klpq-vps-rtmp': {
    asset: './static/icons/klpq_vps.svg',
    isImage: true,
    color: null,
  },
  'klpq-vps-http': {
    asset: './static/icons/klpq_vps.svg',
    isImage: true,
    color: null,
  },
  'youtube-user': {
    asset: youtubePlay,
    isImage: false,
    color: '#E62117',
  },
  'youtube-channel': {
    asset: youtubePlay,
    isImage: false,
    color: '#E62117',
  },
  default: {
    asset: eye,
    isImage: false,
    color: 'darkgreen',
  },
};

@withTheme
class ServiceIcon extends Component {
  getIcon = (serviceName) => {
    return Services[serviceName] ? Services[serviceName] : Services['default'];
  };

  renderImage = (asset) => (
    <IconWithImage>
      <img src={asset} />
    </IconWithImage>
  );

  renderSVG = ({ asset, color, padding }) => (
    <IconWithService
      style={{ paddingTop: padding || 0 }}
      icon={asset}
      color={color}
    />
  );

  renderIcon = (icon) => {
    if (icon.isImage) {
      return this.renderImage(icon.asset);
    } else {
      return this.renderSVG(icon);
    }
  };

  render() {
    const { service } = this.props;
    const icon = this.getIcon(service);
    return this.renderIcon(icon);
  }
}

export default ServiceIcon;

const IconWithImage = styled.div`
  width: 16px;
  height: 16px;
  & > img {
    width: 100%;
  }
`;

const IconWithService = styled(Icon)`
  width: 16px;
  height: 16px;
  color: ${(props) => (!!props.color ? props.color : 'darkgreen')};
`;
