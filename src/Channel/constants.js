
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