const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const {ipcRenderer} = require('electron');
let current_context = "";


var menu = new Menu();

menu.append(new MenuItem({
    label: 'Play Original', click: function () {
        ipcRenderer.send('channel-play', current_context.data('id'), false);
    }
}));

menu.append(new MenuItem({
    label: 'Play Low Quality', click: function () {
        ipcRenderer.send('channel-play', current_context.data('id'), true);
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

$(document).on('mouseup', '.item', function (e) {
    if (event.which == 3) {
        $('.item.selected').removeClass('selected');
    }
});

$('document').ready(function () {

    let theme = $('#theme-selected').html();
    $('#theme').val(theme);
    $('.change-page').on('click', function () {
        $('.page').removeClass('active');
        $pageToOpen = $('#' + $(this).data('page') + '-page');
        $pageToOpen.addClass('active');

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
        $item = $('.item[data-id="' + channel.link + '"]');
        $('.item[data-id="' + channel.link + '"]').remove();
        $('#online').append($item);
    });

    ipcRenderer.on('channel-went-offline', function (event, channel) {
        $item = $('.item[data-id="' + channel.link + '"]');
        $('.item[data-id="' + channel.link + '"]').remove();
        $('#offline').append($item);
    });

    $('#add-channel-btn').on('click', function () {
        let channel = $('#add-channel').val();
        if (channel.length > 0) {
            let channelToSend = {'name': channel, 'link': channel};
            ipcRenderer.send('add-channel', channelToSend);

        }
    });

    ipcRenderer.on('add-channel-response', function (event, output) {
        console.log(output);
        if (output.status) {
            let channel_form = '<div class="item">' +
                '<span class="item-icon fa-twitch fa"></span>' +
                '<span class="item-name">' + output.channel.link + '</span>' +
                '</div>';
            $('#offline').append(channel_form);
        }

        $('#add-channel').val('');
    });

    $('#theme').on('change', function () {
        $selected = $(this).find(':selected').data('theme');
        $('#theme-css').attr('href', "./assets/css/" + $selected + '.css');
        ipcRenderer.send('change-setting', {name: 'theme', value: $selected});
    });

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
