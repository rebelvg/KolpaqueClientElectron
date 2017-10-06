const {remote, ipcRenderer} = window.require('electron');
const {app, Menu, shell, BrowserWindow, MenuItem} = remote;

const menuTemplate = (channel, deleteFunction) => [
    new MenuItem({
        label: 'Play', click: function () {
            ipcRenderer.send('channel-play', {link: channel.link, LQ: false});
        }
    }),
    new MenuItem({
        label: 'Play LQ', click: function () {
            ipcRenderer.send('channel-play', {link: channel.link, LQ: true});
        }
    }),
    new MenuItem({
        label: 'Open Page', click: function () {
            ipcRenderer.send('open-page', channel.link);
        }
    }),
    new MenuItem({
        label: 'Open Chat', click: function () {
            ipcRenderer.send('open-chat', channel.link);
        }
    }),
    new MenuItem({
        label: 'Copy to Clipboard', click: function () {
            ipcRenderer.send('copy-clipboard', channel.link);
        }
    }),
    new MenuItem({
        label: 'Remove Channel', click: function () {
            deleteFunction(channel);
            ipcRenderer.send('remove-channel', channel.link);
        }
    })
];

export default menuTemplate
