const {remote, ipcRenderer} = window.require('electron');
const {app, Menu, shell, BrowserWindow, MenuItem} = remote;

const menuTemplate = (channel) => [
    new MenuItem({
        label: 'Play', click: function () {
            ipcRenderer.send('channel_play', channel.id, false);
        }
    }),
    new MenuItem({
        label: 'Play LQ', click: function () {
            ipcRenderer.send('channel_play', channel.id, true);
        }
    }),
    new MenuItem({
        label: 'Open Page', click: function () {
            ipcRenderer.send('channel_openPage', channel.id);
        }
    }),
    new MenuItem({
        label: 'Open Chat', click: function () {
            ipcRenderer.send('channel_openChat', channel.id);
        }
    }),
    new MenuItem({
        label: 'Copy to Clipboard', click: function () {
            ipcRenderer.send('channel_copyClipboard', channel.link);
        }
    }),
    new MenuItem({
        label: 'Remove Channel', click: function () {
            ipcRenderer.send('channel_remove', channel.id);
        }
    })
];

export default menuTemplate
