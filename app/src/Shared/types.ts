export interface Channel {
  id: string;
  url: string;
  serviceName: string;
  visibleName: string;
  isPinned: boolean;
  autoStart: boolean;
  autoRestart: boolean;
  onAutoRestart: boolean;
  _iconUrl: string | null;
  isLive: boolean;
}

export interface ChannelCount {
  online: number;
  offline: number;
}

export interface ChannelQuery {
  isLive: boolean;
  filter: string;
}

export interface Settings {
  nightMode: boolean;
  LQ?: boolean;
  showNotifications?: boolean;
  showNotificationsOnlyFavorites?: boolean;
  enableNotificationSounds?: boolean;
  minimizeAtStart?: boolean;
  launchOnBalloonClick?: boolean;
  confirmAutoStart?: boolean;
  playInWindow?: boolean;
  sortType?: string;
  sortReverse?: boolean;
  customRtmpClientCommand?: string;
  useStreamlinkForCustomChannels?: boolean;
  enableTwitchImport?: boolean;
  twitchImport?: string[];
  [key: string]: unknown;
}

export interface Integrations {
  twitch: boolean | null;
  kick?: boolean | null;
  klpq?: boolean | null;
  [key: string]: boolean | null | undefined;
}

export type ActionType = 'RENAME' | 'OPEN_MENU' | 'SELECT';

export interface ActionPayloadMap {
  RENAME: [string, string];
  OPEN_MENU: [Channel];
  SELECT: [number, Channel];
}
