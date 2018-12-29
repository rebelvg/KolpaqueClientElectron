const { remote, ipcRenderer } = require('electron');
const { app, Menu, shell, BrowserWindow, MenuItem } = remote;

const menuTemplate = (channel, edit) => [
  new MenuItem({
    label: 'Play',
    click: function(menuItem, browserWindow, event) {
      ipcRenderer.send('channel_play', channel.id, event.ctrlKey, event.shiftKey ? true : null);
    },
    sublabel: 'Ctrl - Alt Quality, Shift - Auto-Restart'
  }),
  new MenuItem({
    label: 'Open Page',
    click: function() {
      ipcRenderer.send('channel_openPage', channel.id);
    }
  }),
  new MenuItem({
    label: 'Open Chat',
    click: function() {
      ipcRenderer.send('channel_openChat', channel.id);
    }
  }),
  new MenuItem({
    label: 'Rename Channel',
    click: function() {
      edit(channel);
    }
  }),
  new MenuItem({
    label: 'Copy to Clipboard',
    click: function() {
      ipcRenderer.send('channel_copyClipboard', channel.link);
    }
  }),
  new MenuItem({
    label: 'Remove Channel',
    click: function() {
      ipcRenderer.send('channel_remove', channel.id);
    }
  })
];

export default menuTemplate;
