import { MenuItem } from '@electron/remote';

const { ipcRenderer } = window.require('electron');

export const menuTemplate = (channel, edit) => [
  new MenuItem({
    label: 'Play (Ctrl - Low Quality, Shift - Auto-Restart)',
    click: function (menuItem, browserWindow, event) {
      ipcRenderer.send(
        'channel_play',
        channel.id,
        event.ctrlKey,
        event.shiftKey ? true : null,
      );
    },
  }),
  new MenuItem({
    label: 'Open Page',
    click: function () {
      ipcRenderer.send('channel_openPage', channel.id);
    },
  }),
  new MenuItem({
    label: 'Open Chat',
    click: function () {
      ipcRenderer.send('channel_openChat', channel.id);
    },
  }),
  new MenuItem({
    label: 'Rename Channel',
    click: function () {
      edit(channel);
    },
  }),
  new MenuItem({
    label: 'Copy to Clipboard',
    click: function () {
      ipcRenderer.send('channel_copyClipboard', channel.link);
    },
  }),
  new MenuItem({
    label: 'Remove Channel',
    click: function () {
      ipcRenderer.send('channel_remove', channel.id);
    },
  }),
];
