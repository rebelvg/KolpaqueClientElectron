const {remote, ipcRenderer} = window.require('electron');
const {app, Menu, shell, BrowserWindow, MenuItem} = remote;

const menuTemplate = (channel, deleteFunction) => [
    new MenuItem({
        label: 'Play', click: function () {
            ipcRenderer.send('channel_play', channel.link, false);
        }
    }),
    new MenuItem({
        label: 'Play LQ', click: function () {
            ipcRenderer.send('channel_play', channel.link, true);
        }
    }),
    new MenuItem({
        label: 'Open Page', click: function () {
            ipcRenderer.send('channel_openPage', channel.link);
        }
    }),
    new MenuItem({
        label: 'Open Chat', click: function () {
            ipcRenderer.send('channel_openChat', channel.link);
        }
    }),
    new MenuItem({
        label: 'Copy to Clipboard', click: function () {
            ipcRenderer.send('channel_copyClipboard', channel.link);
        }
    }),
    new MenuItem({
        label: 'Remove Channel', click: function () {
            deleteFunction(channel);
            ipcRenderer.send('channel_remove', channel.link);
        }
    })
];

export default menuTemplate
