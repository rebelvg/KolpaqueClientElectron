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
  serviceName: Channel['serviceName'];
  iconUrl?: Channel['_iconUrl'];
  isLive?: Channel['isLive'];
}

interface ServiceIconState {
  failedCustomIcon: boolean;
}

export class ServiceIcon extends Component<ServiceIconProps, ServiceIconState> {
  state: ServiceIconState = { failedCustomIcon: false };

  componentDidUpdate(prevProps: ServiceIconProps) {
    if (
      this.props.iconUrl !== prevProps.iconUrl ||
      this.props.isLive !== prevProps.isLive
    ) {
      this.setState({ failedCustomIcon: false });
    }
  }

  getIcon = (serviceName: string): Service => {
    return Services[serviceName] ? Services[serviceName] : Services['default'];
  };

  handleIconError = () => this.setState({ failedCustomIcon: true });

  renderImage = (asset: string, withFallback = false) => (
    <IconWithImage>
      <img
        src={asset}
        onError={withFallback ? this.handleIconError : undefined}
        alt=""
      />
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
    const { serviceName, iconUrl, isLive } = this.props;

    if (isLive && iconUrl && !this.state.failedCustomIcon) {
      return this.renderImage(iconUrl, true);
    }

    const icon = this.getIcon(serviceName);

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
