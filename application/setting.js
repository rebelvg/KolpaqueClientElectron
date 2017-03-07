$('document').ready(function () {
    $('.collapse-list').on('click', function () {
        let $button = $(this);
        console.log($button.data('id'));

        let $item = $('#' + $button.data('id'));

        if ($item.hasClass('active')) {
            $item.removeClass('active');

        }
        else {
            $item.addClass('active');


        }

    });
});