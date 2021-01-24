import { app, dialog } from 'electron';
import { URL } from 'url';
import * as _ from 'lodash';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
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

const channelValidate = ['visibleName', 'isPinned', 'autoStart', 'autoRestart'];

export class Channel extends EventEmitter {
  public id: string;
  public serviceName: ServiceNamesEnum = ServiceNamesEnum.CUSTOM;
  private serviceObj: BaseStreamService;
  public name: string;
  public link: string;
  public protocol: ProtocolsEnum;
  public isLive = false;
  public onAutoRestart = false;
  public lastUpdated = 0;
  public _processes: ChildProcess[] = [];
  public _icon: Buffer;
  public _autoRestartAttempts = 0;
  public _startTime = 0;
  public _offlineConfirmations = 0;
  public _windows = [];
  public _customPlayUrl: string;
  public visibleName: string;
  public isPinned = false;
  public autoStart = false;
  public autoRestart = false;
  public _trayIcon: Electron.NativeImage;

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
      throw Error(`Hostname can't be empty.`);
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
      });
    }

    this.visibleName = this.name;

    this.on('setting_changed', (settingName, settingValue, send) => {
      if (send) {
        app['mainWindow'].webContents.send('channel_changeSettingSync');
      }
    });

    this.on('settings_changed', (send) => {
      if (send) {
        app['mainWindow'].webContents.send('channel_changeSettingSync');
      }
    });
  }

  public update(channelConfig: Record<string, unknown>): void {
    _.forEach(channelConfig, (settingValue, settingName) => {
      if (channelValidate.includes(settingName)) {
        if (settingName === 'visibleName' && !settingValue) {
          return;
        }

        this[settingName] = settingValue;
      }
    });
  }

  public changeSetting(
    settingName: string,
    settingValue: unknown,
    send = true,
  ): boolean {
    if (!this.hasOwnProperty(settingName)) {
      return false;
    }

    this[settingName] = settingValue;

    this.emit('setting_changed', settingName, settingValue, send);

    return true;
  }

  public changeSettings(
    settings: Record<string, unknown>,
    send = true,
  ): boolean {
    _.forEach(settings, (settingValue, settingName) => {
      this.changeSetting(settingName, settingValue, false);
    });

    this.emit('settings_changed', send);

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
    return this.serviceObj.icon;
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

    addLogs(`${this.link} went online.`);

    if (printBalloon) {
      printNotification('Stream is Live', this.visibleName, this);
    }

    if (printBalloon && config.settings.showNotifications && this.autoStart) {
      if (this._processes.length === 0) {
        if (config.settings.confirmAutoStart) {
          dialog
            .showMessageBox({
              type: 'none',
              message: `${this.link} is trying to auto-start. Confirm?`,
              buttons: ['Ok', 'Cancel'],
            })
            .then(({ response }) => {
              if (response === 0) {
                this.emit('play');
              }
            });
        } else {
          this.emit('play');
        }
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

    addLogs(`${this.link} went offline.`);

    this.changeSettings({
      lastUpdated: Date.now(),
      isLive: false,
    });
  }
}
