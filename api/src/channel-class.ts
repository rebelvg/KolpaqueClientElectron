import { BrowserWindow, dialog, NativeImage } from 'electron';
import { URL } from 'url';
import * as _ from 'lodash';
import { EventEmitter } from 'events';
import * as uuid from 'uuid';

import { addLogs } from './logs';
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

export class Channel extends EventEmitter {
  public readonly id: string;
  public serviceName: ServiceNamesEnum = ServiceNamesEnum.CUSTOM;
  public serviceObj: BaseStreamService = new BaseStreamService();
  public name: string;
  public link: string;
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
  public _playingProcesses = 0;
  public channelAdded: Date;
  public sources: SourcesEnum[] = [];
  public meta: Record<string, string> = {};
  public _trayIcon: NativeImage;
  public _iconChecked = false;

  constructor(channelLink: string) {
    super();

    channelLink = channelLink.trim();

    this.id = uuid.v4();
    this.link = channelLink;
    this.name = this.link;
    this.channelAdded = new Date();

    const channelURL = new URL(channelLink);

    const protocol = channelURL.protocol.toLowerCase() as ProtocolsEnum;

    this.protocol = protocol;

    const host = channelURL.host.toLowerCase();

    if (host.length === 0) {
      throw new Error('empty_hostname');
    }

    for (const serviceObj of serviceManager.services) {
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
        this.name = channelName!;

        const newChannelUrl = new URL(
          serviceObj.buildChannelLink(channelName!),
        );

        this.link = newChannelUrl.href;

        return false;
      });
    }

    this.visibleName = this.name;
  }

  public update(
    channelConfig: Omit<ISavedSettingsFile['channels'][0], 'link'>,
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

    main.mainWindow!.webContents.send('channel_changeSettingSync');

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

  public icon() {
    return this._icon ? this._icon : this.serviceObj.icon;
  }

  public trayIcon() {
    if (this._trayIcon) {
      return this._trayIcon;
    }

    if (this.serviceObj._trayIcon) {
      return this.serviceObj._trayIcon;
    }

    return;
  }

  public chatLink() {
    return this.serviceObj.chatLink(this);
  }

  public checkLiveConfirmation() {
    return this.serviceObj.checkLiveConfirmation;
  }

  public setOnline(printBalloon: boolean) {
    this._offlineConfirmations = 0;

    if (this.isLive) {
      return;
    }

    addLogs('info', this.link, 'went_online');

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

    addLogs('info', this.link, 'went_offline');

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

  private settingsActions(settingName: string, settingValue: any) {
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
}
