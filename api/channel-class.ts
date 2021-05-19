import { BrowserWindow, dialog } from 'electron';
import { URL } from 'url';
import * as _ from 'lodash';
import { EventEmitter } from 'events';
import * as uuid from 'uuid';

import { REGISTERED_SERVICES } from './globals';
import { addLogs } from './logs';
import { printNotification } from './notifications';
import { config } from './settings-file';
import {
  BaseStreamService,
  ProtocolsEnum,
  ServiceNamesEnum,
} from './stream-services/_base';
import { customStreamService } from './stream-services/custom';
import { launchPlayerChannel, playInWindow } from './channel-play';
import { main } from './main';
import { ISavedSettingsFile } from './config-class';

export class Channel extends EventEmitter {
  public readonly id: string;
  public serviceName: ServiceNamesEnum = ServiceNamesEnum.CUSTOM;
  private serviceObj: BaseStreamService = customStreamService;
  public name: string;
  public link: string;
  public protocol: ProtocolsEnum;
  public isLive = false;
  public onAutoRestart = false;
  public lastUpdated = 0;
  public _icon: Buffer;
  public _offlineConfirmations = 0;
  public _windows: BrowserWindow[] = [];
  public _customPlayUrl: string;
  public visibleName: string;
  public isPinned = false;
  public autoStart = false;
  public autoRestart = false;
  public _trayIcon: Electron.NativeImage;
  public _playingProcesses = 0;

  constructor(channelLink: string) {
    super();

    channelLink = channelLink.trim();

    this.id = uuid.v4();
    this.link = channelLink;
    this.name = this.link;

    const channelURL = new URL(channelLink);

    const protocol = channelURL.protocol.toLowerCase() as ProtocolsEnum;

    this.protocol = protocol;

    const host = channelURL.host.toLowerCase();

    if (host.length === 0) {
      throw new Error('empty_hostname');
    }

    for (const serviceObj of REGISTERED_SERVICES) {
      if (!serviceObj.protocols.includes(protocol)) {
        continue;
      }

      if (!serviceObj.hosts.includes(host)) {
        continue;
      }

      _.forEach(serviceObj.paths, (path) => {
        const regRes = new RegExp(path).exec(channelURL.pathname);

        if (!regRes) {
          return;
        }

        const [, channelName] = regRes;

        this.serviceName = serviceObj.name;
        this.serviceObj = serviceObj;
        this.name = channelName;

        const newChannelUrl = new URL(serviceObj.buildChannelLink(channelName));

        this.link = newChannelUrl.href;

        return false;
      });
    }

    this.visibleName = this.name;
  }

  public update(channelConfig: ISavedSettingsFile['channels'][0]): void {
    if (channelConfig.visibleName) {
      this.visibleName = channelConfig.visibleName;
    }

    this.isPinned = channelConfig.isPinned;
    this.autoStart = channelConfig.autoStart;
    this.autoRestart = channelConfig.autoRestart;
  }

  private changeSetting(settingName: string, settingValue: unknown): boolean {
    if (!this.hasOwnProperty(settingName)) {
      return false;
    }

    this[settingName] = settingValue;

    this.settingsActions(settingName, settingValue);

    return true;
  }

  public changeSettings(settings: Partial<Channel>, send = true): boolean {
    _.forEach(settings, (settingValue, settingName) => {
      this.changeSetting(settingName, settingValue);
    });

    if (send) {
      main.mainWindow.webContents.send('channel_changeSettingSync');
    }

    return true;
  }

  public filterData() {
    return {
      id: this.id,
      service: this.serviceName,
      name: this.name,
      link: this.link,
      protocol: this.protocol,
      isLive: this.isLive,
      onAutoRestart: this.onAutoRestart,
      lastUpdated: this.lastUpdated,
      visibleName: this.visibleName,
      isPinned: this.isPinned,
      autoStart: this.autoStart,
      autoRestart: this.autoRestart,
    };
  }

  public play() {
    return this.serviceObj.play(this);
  }

  public playLQ() {
    return this.serviceObj.playLQ(this);
  }

  public embedLink() {
    return this.serviceObj.embedLink(this);
  }

  public host() {
    return this.serviceObj.hosts[0];
  }

  public icon() {
    return this._icon ? this._icon : this.serviceObj.icon;
  }

  public chatLink() {
    return this.serviceObj.chatLink(this);
  }

  public checkLiveConfirmation() {
    return this.serviceObj.checkLiveConfirmation;
  }

  public async setOnline(printBalloon: boolean) {
    this._offlineConfirmations = 0;

    if (this.isLive) {
      return;
    }

    addLogs(this.link, 'went_online');

    if (printBalloon) {
      printNotification('Stream is Live', this.visibleName, this);
    }

    if (
      printBalloon &&
      config.settings.showNotifications &&
      this.autoStart &&
      this._playingProcesses === 0
    ) {
      if (config.settings.confirmAutoStart) {
        dialog
          .showMessageBox({
            type: 'none',
            message: `${this.link} is trying to auto-start. Confirm?`,
            buttons: ['Ok', 'Cancel'],
          })
          .then(async ({ response }) => {
            if (response === 0) {
              await this.startPlaying();
            }
          });
      } else {
        await this.startPlaying();
      }
    }

    this.changeSettings({
      lastUpdated: Date.now(),
      isLive: true,
    });
  }

  public setOffline() {
    if (!this.isLive) {
      return;
    }

    this._offlineConfirmations++;

    if (this._offlineConfirmations < this.checkLiveConfirmation()) {
      return;
    }

    addLogs(this.link, 'went_offline');

    this.changeSettings({
      lastUpdated: Date.now(),
      isLive: false,
    });
  }

  public async startPlaying(
    altQuality = false,
    autoRestart = null,
  ): Promise<boolean> {
    if (config.settings.playInWindow) {
      const wasWindowCreated = await playInWindow(this);

      if (wasWindowCreated) {
        return true;
      }
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
    await this.serviceObj.getStats([this], printBalloon);
  }

  public async getInfo() {
    await this.serviceObj.getInfo([this]);
  }
}
