const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const {ipcRenderer} = require('electron');
let current_context = "";
let online_count = 0;
let offline_count = 0;
let template = [
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

let menu = new Menu();

menu.append(new MenuItem({
    label: 'Play', click: function () {
        ipcRenderer.send('channel-play', {link: current_context.data('id'), LQ: false, untilOffline: false});
    }
}));

menu.append(new MenuItem({
    label: 'Play (Until Offline)', click: function () {
        ipcRenderer.send('channel-play', {link: current_context.data('id'), LQ: false, untilOffline: true});
    }
}));

menu.append(new MenuItem({
    label: 'Play LQ', click: function () {
        ipcRenderer.send('channel-play', {link: current_context.data('id'), LQ: true, untilOffline: false});
    }
}));

menu.append(new MenuItem({
    label: 'Play LQ (Until Offline)', click: function () {
        ipcRenderer.send('channel-play', {link: current_context.data('id'), LQ: true, untilOffline: true});
    }
}));

menu.append(new MenuItem({
    label: 'Disable Until Offline Play', click: function () {
        ipcRenderer.send('disable-until-offline-play', {link: current_context.data('id')});
    }
}));

menu.append(new MenuItem({
    label: 'Open Page', click: function () {
        ipcRenderer.send('open-page', current_context.data('id'));
    }
}));

menu.append(new MenuItem({
    label: 'Open Chat', click: function () {
        ipcRenderer.send('open-chat', current_context.data('id'));
    }
}));

menu.append(new MenuItem({
    label: 'Copy to Clipboard', click: function () {
        ipcRenderer.send('copy-clipboard', current_context.data('id'));
    }
}));

menu.append(new MenuItem({
    label: 'Remove Channel', click: function () {
        ipcRenderer.send('remove-channel', current_context.data('id'));
    }
}));


$(document).on('contextmenu', '.item', function (e) {
    current_context = $(this);
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
});

$(document).on('mousedown', '.item', function (e) {
    if (event.which == 3) {
        $('.item.selected').removeClass('selected');
        $(this).addClass('selected');
    }
});
$(document).on('dblclick', '.item', function (e) {
    let isLQ = $('#LQ').prop('checked');
    ipcRenderer.send('channel-play', {link: $(this).data('id'), LQ: isLQ});
});
$(document).on('mouseup', '.item', function (e) {
    if (event.which == 3) {
        $('.item.selected').removeClass('selected');
    }
});
$('#add-channel').on('contextmenu', function (e) {
    e.preventDefault();
    var macMenu = Menu.buildFromTemplate(template);
    macMenu.popup(remote.getCurrentWindow());

});

const setNewCount = () => {
    "use strict";
    $('.online-count').html(online_count);
    $('.offline-count').html(offline_count);
}

$('document').ready(function () {
    offline_count = $('.offline-count').html();
    console.log(offline_count);
    setNewCount();
    ipcRenderer.send('client-ready', true);

    $('.twitch-import').on('click', function () {
        ipcRenderer.send('twitch-import', $('#twitch-nickname').val());
        $('#twitch-nickname').val('');
    });

    let theme = $('#theme-selected').html();
    $('#theme').val(theme);
    $('.change-page').on('click', function () {
        let $pageToOpen = $('#' + $(this).data('page') + '-page');
        $('.page.active').fadeOut(150, function () {
            $(this).removeClass('active');

            $pageToOpen.fadeIn(150).addClass('active');
        });


    });

    $('.collapse-list').on('click', function () {
        let $button = $(this);
        console.log($button.data('id'));

        let $item = $('#' + $button.data('id'));

        if ($item.hasClass('active')) {
            $item.removeClass('active');
            $button.find('.icon').removeClass('active');
        }
        else {
            $item.addClass('active');
            $button.find('.icon').addClass('active');
        }
    });

    ipcRenderer.on('channel-went-online', function (event, channel) {
        online_count++;
        offline_count--;
        $item = $('.item[data-id="' + channel.link + '"]');
        let $temp = $item;
        $item.remove();
        $('#online').append($temp);
        setNewCount();
    });

    ipcRenderer.on('channel-went-offline', function (event, channel) {
        offline_count++;
        online_count--;

        $item = $('.item[data-id="' + channel.link + '"]');
        let $temp = $item;
        $item.remove();
        $('#offline').append($temp);
        setNewCount();
    });

    ipcRenderer.on('check-update', function (event, data) {
        $('#update').html(data.text);
    });

    $('#add-channel-btn').on('click', function () {
        let channel = $('#add-channel').val();
        if (channel.length > 0) {
            let channelToSend = {'name': channel, 'link': channel};
            ipcRenderer.send('add-channel', channelToSend);

        }
    });

    ipcRenderer.on('remove-channel-response', function (event, output) {
        if (output.status) {
            $('.item[data-id="' + output.channelLink + '"]').remove();
            offline_count = $('#offline > .item').length;
            online_count = $('#online > .item').length;
            setNewCount();
        }

        $('#add-channel').val('');
    });

    ipcRenderer.on('add-channel-response', function (event, output) {
        if (output.status) {
            let channel_form = '<div class="item" data-id="' + output.channel.link + '">' +
                '<span class="item-icon fa-twitch fa"></span>' +
                '<span class="item-name">' + output.channel.link + '</span>' +
                '</div>';
            $('#offline').append(channel_form);
            offline_count++;
            setNewCount();
        }

        $('#add-channel').val('');
    });

    $('#theme').on('change', function () {
        $selected = $(this).find(':selected').data('theme');
        $('#theme-css').attr('href', "./assets/css/" + $selected + '.css');
        ipcRenderer.send('change-setting', {name: 'theme', value: $selected});
    });
    $('#update').on('click', function () {
        "use strict";
        ipcRenderer.send('get-update');
    })
    $('#livestreamer_input').on('change', function () {
        if ($(this).get(0).files.length != 0) {
            let path = this.files[0].path;
            $('#livestreamer_path').val(path);
            ipcRenderer.send('change-setting', {name: "livestreamerPath", value: path});
        }
    });

    $('.file-input-addon').on('click', function () {
        $('#livestreamer_input').click();
    });

    $('.settings').on('change', function () {
        settingsName = $(this).data('settings');
        settingsValue = $(this).prop('checked');
        let settingsToChange = {name: settingsName, value: settingsValue};
        ipcRenderer.send('change-setting', settingsToChange);
    });

});
