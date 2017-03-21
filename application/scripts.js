var remote = require('electron').remote;
const {ipcRenderer} = require('electron');
$('document').ready(function () {
    $('.change-page').on('click', function () {
        $('.page').fadeOut();
        $pageToOpen = $('#' + $(this).data('page') + '-page');
        console.log($pageToOpen);
        $pageToOpen.fadeIn();
    });

    $('.collapse-list').on('click', function () {
        let $button = $(this);
        console.log($button.data('id'));

        let $item = $('#' + $button.data('id'));

        if ($item.hasClass('active')) {
            $item.removeClass('active');
            $button.find('.fa').removeClass('fa-caret-down').addClass('fa-caret-right');
        }
        else {
            $item.addClass('active');
            $button.find('.fa').removeClass('fa-caret-right').addClass('fa-caret-down');
        }
    });

    $('#add-channel-btn').on('click', function () {
        let channel = $('#add-channel').val();
        if (channel.length > 0) {
            let channelToSend = {'name': channel, 'link': channel};
            ipcRenderer.send('add-channel', channelToSend);
            let channel_form = '<div class="item">' +
                '<span class="item-icon fa-twitch fa"></span>' +
                '<span class="item-name">' + channel + '</span>' +
                '</div>';
            $('#online').append(channel_form);
        }
    });
});
