global.$ = $;

const {remote} = require('electron');
$('document').ready(function () {
    $('.settings').on('click', function () {
        alert('You pressed button');
    });
});