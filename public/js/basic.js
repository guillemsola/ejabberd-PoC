var BOSH_SERVICE = 'https://192.168.99.100:5280/http-bind';
var connection = null;

function log(msg, cssClass) {
    $('#log').prepend('<div></div>');
    $('#log div:first').append(document.createTextNode(msg));

    if (cssClass !== undefined) {
        $('#log div:first').addClass(cssClass);
    }
}

function rawInput(data) {
    log(data, 'received');
}

function rawOutput(data) {
    log(data, 'sent');
}

function onConnect(status) {
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
   
    // connection.send($pres().tree());
}

$(document).ready(function () {
    log('Document ready.');
    connection = new Strophe.Connection(BOSH_SERVICE);
    // Receive messages: handler, namespace, stanzaName (normal, headline), type, id, from, options
    connection.addHandler(getEvent, null, 'message', null, null, pubsubUrl);
 
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

    $('#create-node').bind('click', function () {
        log('Create node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
        // TODO create node without name and let the server assign it. Name will be returned with the reply.
            .c('create', { node: nodeName() });
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });
    
    $('#delete-node').bind('click', function () {
        log('Delete node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('delete', { node: nodeName() });
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });

    $('#get-node-form').bind('click', function () {
        log('Get node ' + nodeName() + ' details');
        var pub = $iq({ type: 'get', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub#owner' })
            .c('configure', { node: nodeName() });
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });
    
    $('#subscribe-node').bind('click', function () {
        log('Subscribing to node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('subscribe', { node: nodeName(), jid : jid() });
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });
    
    $('#list-subscriptions-node').bind('click', function () {
        log('List subscriptions from node ' + nodeName());
        var pub = $iq({ type: 'get', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('subscriptions', { node: nodeName() });
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });

    $('#publish-node').bind('click', function () {
        log('Publish in node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('publish', { node: nodeName() })
            .c('item')
            .c('x', {xmlns :'jabber:x:data'})
            .c('value').t($('#node-event').get(0).value);
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });
});

function pubSuccess(msg) {
    log('Publish ok.')
}

function pubError(err) {
    log('Publish error.');
}

var pubsubUrl = 'pubsub.example.com';

function jid() {
    return $('#jid').get(0).value;
}

function nodeName() {
    return $('#node-name').get(0).value;    
};

function getEvent(event) {
    log('NEW EVENT!!!');
    log(event, 'event');
}