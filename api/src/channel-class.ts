import { BrowserWindow, dialog, NativeImage } from 'electron';
import { URL } from 'url';
import * as _ from 'lodash';
import { EventEmitter } from 'events';
import * as uuid from 'uuid';

import { logger } from './logs';
import { printNotification } from './notifications';
import { config } from './settings-file';
import {
  BaseStreamService,
  ProtocolsEnum,
  ServiceNamesEnum,
} from './stream-services/_base';

import { launchPlayerChannel, playInWindow } from './channel-play';
import { main, refreshTrayIconMenuLinux } from './main';
import { ISavedSettingsFile } from './config-class';
import { SourcesEnum } from './enums';
import { sleep } from './helpers';
import { serviceManager } from './services';
import { ChildProcessWithoutNullStreams } from 'child_process';

export class Channel extends EventEmitter {
  public readonly id: string;
  public service: BaseStreamService = new BaseStreamService();
  public name: string;
  public url: string;
  public protocol: ProtocolsEnum;
  public isLive = false;
  public onAutoRestart = false;
  public lastUpdated = 0;
  public _icon: Buffer;
  public _offlineConfirmations = 0;
  public _windows: BrowserWindow[] = [];
  public _customPlayUrl: string | null;
  public visibleName: string;
  public isPinned = false;
  public autoStart = false;
  public autoRestart = false;
  public _playingProcesses: ChildProcessWithoutNullStreams[] = [];
  public channelAdded: Date;
  public sources: SourcesEnum[] = [];
  public meta: Record<string, string> = {};
  public _trayIcon: NativeImage;
  public _iconChecked = false;
  public _iconUrl: string | null = null;

  constructor(inputUrl: string) {
    super();

    inputUrl = inputUrl.trim().toLowerCase();

    this.id = uuid.v4();
    this.url = inputUrl;
    this.name = this.url;
    this.channelAdded = new Date();

    const { hostname, protocol, pathname } = new URL(inputUrl);

    this.protocol = protocol as ProtocolsEnum;

    for (const service of serviceManager.services) {
      if (!service.protocols.includes(this.protocol)) {
        continue;
      }

      if (!service.hosts.includes(hostname)) {
        continue;
      }

      for (const path of service.paths) {
        const regRes = new RegExp(path).exec(pathname);

        if (!regRes) {
          continue;
        }

        const [, channelName] = regRes;

        if (!channelName) {
          continue;
        }

        this.service = service;
        this.name = channelName;

        const { href } = new URL(service.buildUrl(channelName));

        this.url = href;

        break;
      }
    }

    this.visibleName = this.name;
  }

  public update(
    channelConfig: Omit<ISavedSettingsFile['channels'][0], 'url'>,
  ): void {
    _.forEach(channelConfig, (value, key) => {
      this[key] = value;
    });
  }

  private changeSetting(settingName: string, settingValue: unknown): boolean {
    if (!this.hasOwnProperty(settingName)) {
      return false;
    }

    this[settingName] = settingValue;

    this.settingsActions(settingName, settingValue);

    return true;
  }

  public changeSettings(settings: Partial<Channel>): boolean {
    _.forEach(settings, (settingValue, settingName) => {
      this.changeSetting(settingName, settingValue);
    });

    main.mainWindow!.webContents.send('channel_changeSetting_api');

    return true;
  }

  public play() {
    return this.service.play(this);
  }

  public playLQ() {
    return this.service.playLQ(this);
  }

  public embedUrl() {
    return this.service.embedUrl(this);
  }

  public icon() {
    return this._icon ? this._icon : this.service.icon;
  }

  public trayIcon() {
    if (this._trayIcon) {
      return this._trayIcon;
    }

    return this.service._trayIcon;
  }

  public chatUrl() {
    return this.service.chatUrl(this);
  }

  public checkLiveConfirmation() {
    return this.service.checkLiveConfirmation;
  }

  public setOnline(printBalloon: boolean) {
    this._offlineConfirmations = 0;

    if (this.isLive) {
      return;
    }

    logger('info', this.url, 'went_online');

    if (printBalloon) {
      if (!this.autoStart) {
        printNotification('Stream is Live', this.visibleName, this);
      } else {
        printNotification(
          'Stream is Live with Autostart',
          this.visibleName,
          this,
        );
      }
    }

    if (
      printBalloon &&
      config.settings.showNotifications &&
      this.autoStart &&
      this._playingProcesses.length === 0
    ) {
      if (config.settings.confirmAutoStart) {
        dialog
          .showMessageBox({
            type: 'none',
            message: `${this.url} is trying to auto-start. Confirm?`,
            buttons: ['Ok', 'Cancel'],
          })
          .then(async ({ response }) => {
            if (response === 0) {
              await this.startPlaying();
            }
          });
      } else {
        sleep(5000).then(async () => {
          await this.startPlaying();
        });
      }
    }

    this.changeSettings({
      lastUpdated: Date.now(),
      isLive: true,
    });

    refreshTrayIconMenuLinux();
  }

  public setOffline() {
    if (!this.isLive) {
      return;
    }

    this._offlineConfirmations++;

    if (this._offlineConfirmations < this.checkLiveConfirmation()) {
      return;
    }

    logger('info', this.url, 'went_offline');

    this.changeSettings({
      lastUpdated: Date.now(),
      isLive: false,
    });

    refreshTrayIconMenuLinux();
  }

  public async startPlaying(
    altQuality: boolean | null = null,
    autoRestart: boolean | null = null,
  ): Promise<boolean> {
    if (config.settings.playInWindow) {
      return await playInWindow(this);
    }

    await launchPlayerChannel(this, altQuality, autoRestart);

    return true;
  }

  private settingsActions(settingName: string, settingValue: unknown) {
    if (settingName === 'visibleName') {
      if (!settingValue) {
        this[settingName] = this.name;
      }
    }

    if (settingName === 'isLive') {
      if (!settingValue) {
        _.forEach(this._windows, (window) => window.close());

        this._windows = [];
      }
    }
  }

  public async getStats(printBalloon: boolean) {
    await this.service.getStats([this], printBalloon);
  }

  public async getInfo() {
    await this.service.getInfo([this]);
  }
}
