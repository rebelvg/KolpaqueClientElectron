import { app } from 'electron';
import { createHash } from 'crypto';
import { URL } from 'url';
import * as _ from 'lodash';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

import {
  ALLOWED_PROTOCOLS,
  REGISTERED_SERVICES,
  ProtocolsEnum,
  ServiceNamesEnum,
} from './globals';
import { BaseStreamService } from './stream-services/twitch';

const channelValidate = ['visibleName', 'isPinned', 'autoStart', 'autoRestart'];

export class Channel extends EventEmitter {
  public id: string;
  public service: ServiceNamesEnum = ServiceNamesEnum.CUSTOM;
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

    this.link = channelLink;
    this.id = createHash('md5').update(this.link).digest('hex');

    const channelURL = new URL(channelLink);

    const protocol = channelURL.protocol.toLowerCase() as ProtocolsEnum;

    if (!ALLOWED_PROTOCOLS.includes(protocol)) {
      throw Error(`Only [${ALLOWED_PROTOCOLS}] are allowed.`);
    }

    this.protocol = protocol;

    if (channelURL.host.length < 1) {
      throw Error(`Hostname can't be empty.`);
    }

    if (channelURL.pathname.length < 2) {
      throw Error(`Pathname can't be empty.`);
    }

    _.forEach(REGISTERED_SERVICES, (serviceObj) => {
      if (
        serviceObj.protocols.includes(protocol) &&
        serviceObj.hosts.includes(channelURL.host.toLowerCase())
      ) {
        const nameArray = _.split(channelURL.pathname, '/');

        if (nameArray[serviceObj.name]) {
          _.forEach(serviceObj.paths, (path) => {
            if (channelURL.pathname.toLowerCase().indexOf(path) === 0) {
              this.service = serviceObj.serviceName;
              this.serviceObj = serviceObj;
              this.name = nameArray[serviceObj.name];
              this.visibleName = this.name;

              channelURL.protocol = serviceObj.protocols[0];
              channelURL.host = serviceObj.hosts[0];
              channelURL.pathname =
                serviceObj.paths[0] + nameArray[serviceObj.name];

              this.link = channelURL.href;
            }
          });
        }
      }
    });

    if (this.service === ServiceNamesEnum.CUSTOM) {
      const pathname = _.endsWith(channelURL.pathname, '/')
        ? channelURL.pathname.slice(0, -1)
        : channelURL.pathname;

      this.name = this.link;
      this.visibleName = `${channelURL.host}${pathname}`;
    }

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
      service: this.service,
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
}
