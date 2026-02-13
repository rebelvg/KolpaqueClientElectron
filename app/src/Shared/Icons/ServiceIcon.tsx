import React, { Component } from 'react';
import Icon from 'react-icons-kit';
import styled from 'styled-components';
import { twitch } from 'react-icons-kit/fa/twitch';
import { eye } from 'react-icons-kit/fa/eye';
import { youtubePlay } from 'react-icons-kit/fa/youtubePlay';
import { Channel } from '../../Shared/types';

type Service = {
  asset: string;
  isImage: boolean;
  color: string | null;
  padding?: number;
};

const Services: Record<string, Service> = {
  'kolpaque-rtmp': {
    asset: './icons/klpq.svg',
    isImage: true,
    color: null,
  },
  twitch: {
    asset: twitch,
    isImage: false,
    padding: 1,
    color: '#6441a5',
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
  'youtube-username': {
    asset: youtubePlay,
    isImage: false,
    color: '#E62117',
  },
  kick: {
    asset: './icons/kick.ico',
    isImage: true,
    color: null,
  },
  default: {
    asset: eye,
    isImage: false,
    color: 'darkgreen',
  },
};

interface ServiceIconProps {
  service: Channel['service'];
}

export class ServiceIcon extends Component<ServiceIconProps> {
  getIcon = (serviceName: string): Service => {
    return Services[serviceName] ? Services[serviceName] : Services['default'];
  };

  renderImage = (asset: string) => (
    <IconWithImage>
      <img src={asset} />
    </IconWithImage>
  );

  renderSVG = ({ asset, color, padding }: Service) => (
    <IconWithService
      style={{ paddingTop: padding || 0 }}
      icon={asset}
      color={color}
    />
  );

  renderIcon = (icon: Service) => {
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
  color: ${(props) => (props.color ? props.color : 'darkgreen')};
`;
