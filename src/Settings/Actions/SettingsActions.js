const {ipcRenderer} = window.require('electron');

export const GET_SETTINGS = 'GET_SETTINGS';
export const CHANGE_SETTINGS = 'CHANGE_SETTINGS';
export const CHANGE_SETTINGS_RESPONSE = 'CHANGE_SETTINGS_RESPONSE';
export const IMPORT_CHANNEL = 'IMPORT_CHANNEL';

export function initSettings() {
    let data = ipcRenderer.sendSync('getSettings');

    return {
        type: GET_SETTINGS,
        data: data
    };
}

export function importChannel(channelName) {
    ipcRenderer.send('config_twitchImport', channelName)
    return {
        type: IMPORT_CHANNEL
    }
}

export function changeSettings(settingName, settingValue) {
    ipcRenderer.send('config_changeSetting', settingName, settingValue)
    return {
        type: CHANGE_SETTINGS,
    };
}

export function changeSettingsResponse(settingName, settingValue) {
    return {
        type: CHANGE_SETTINGS_RESPONSE,
        settingName,
        settingValue
    };
}