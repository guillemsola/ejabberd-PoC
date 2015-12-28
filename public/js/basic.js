var BOSH_SERVICE = 'https://192.168.99.100:5280/http-bind';
var connection = null;

function log(msg, cssClass) 
{
    $('#log').prepend('<div></div>');
    $('#log div:first').append(document.createTextNode(msg));
    
    if(cssClass !== undefined) {
        $('#log div:first').addClass(cssClass);
    }
}

function rawInput(data)
{
    log(data, 'received');
}

function rawOutput(data)
{
    log(data, 'sent');
}

function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
	log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
	log('Strophe failed to connect.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
	log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
	log('Strophe is disconnected.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
	log('Strophe is connected.');
    }
}

$(document).ready(function () {
    log('Document ready.');
    connection = new Strophe.Connection(BOSH_SERVICE);
    connection.rawInput = rawInput;
    connection.rawOutput = rawOutput;

    $('#connect').bind('click', function () {
        var button = $('#connect').get(0);
        if (button.value == 'connect') {
            log('Click on connect.');
            button.value = 'disconnect';

            connection.connect($('#jid').get(0).value,
                    $('#pass').get(0).value,
                    onConnect);
        } else {
            button.value = 'connect';
            log('Click on disconnect.');
            connection.disconnect();
        }
    });
    
    $('#clear-log').bind('click', function () {
        $('#log').empty();
    });
});
