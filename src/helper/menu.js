const {remote, ipcRenderer} = window.require('electron');
const {app, Menu, shell, BrowserWindow, MenuItem} = remote;

const menuTemplate = (channel, deleteFunction) => [
	new MenuItem({
		label: 'Play',
		click() {
			ipcRenderer.send('channel-play', {link: channel.link, LQ: false, untilOffline: false});
		}
	}),
	new MenuItem({
		label: 'Play LQ (Until Offline)', click: function () {
			ipcRenderer.send('channel-play', {link: channel.link, LQ: true, untilOffline: true});
		}
	}),
	new MenuItem({
		label: 'Disable Until Offline Play', click: function () {
			ipcRenderer.send('disable-until-offline-play', {link: channel.link});
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
			deleteFunction(channel)
			ipcRenderer.send('remove-channel', channel.link);
		}
	})
]

export default menuTemplate