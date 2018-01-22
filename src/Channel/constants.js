export const getTab = (tab) => {
    return TABS.find((t) => t.value === tab);
}

export const TABS = [
    {
        name: 'Online',
        value: 'online',
        filter: 'isLive',
        filterValue: true,
    },
    {
        name: 'Offline',
        value: 'offline',
        filter: 'isLive',
        filterValue: false
    }
]

export const template = [
    {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    },
    {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    },
    {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    },
    {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }
];
