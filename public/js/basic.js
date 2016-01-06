// var BOSH_SERVICE = 'https://192.168.99.100:5280/http-bind';
var BOSH_SERVICE = 'http://192.168.1.78:5280/http-bind';
var domain = 'myatom.org';
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
        $('.messages').empty();
    } else if (status == Strophe.Status.CONNECTED) {
        log('Strophe is connected.');
        // addHandler: function (handler, ns, name, type, id, from)
        connection.addHandler(onEvent, null, 'message', null, null, pubsubUrl);
        connection.addHandler(onMessage, null, 'message', 'chat', null, null);
    }
   
    // connection.send($pres().tree());
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
    
    // LOG

    $('#clear-log').bind('click', function () {
        $('#log').empty();
    });
    
    // MUC
    
    $('#join-muc').bind('click', function () {
        log('Joining MUC ' + mucName());
        
        connection.addHandler(onMucMessage, null, "message", "groupchat");
        
        var pres = $pres({from: jid(), to: mucName() + mucNick() })
        .c('x', {xmlns : 'http://jabber.org/protocol/muc'});
        connection.send(pres);
    });
    
    $('#send-muc').bind('click', function() {
        var msg = $msg({to: mucName(), from: jid(), type: 'groupchat'})
        .c('body').t(mucMessage());
        connection.send(msg); 
    });
    
    $('#presence').bind('click', function() {
        // No human connections may want to notify a negative presence
        var pres = $pres()
        .c("priority").t(priority())
        // .c('status').t('Available');
        connection.send(pres);

    })
    
    // Messages
    
    $('#msg-send').bind('click', function() {
        var msg = $msg({to: msgTo(), from: jid(), type: 'chat'})
        .c('body').t(msgText());
        connection.send(msg);
    });
    
    // Pubsub

    $('#create-node').bind('click', function () {
        log('Create node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('create', {node : nodeName()})
                        
        connection.sendIQ(pub, pubSuccess, pubError, 5000);
        
        var conf = $iq({ type: 'set', to: pubsubUrl })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub#owner' })
            .c('configure', { node: nodeName() })
            .c('x', {xmlns :'jabber:x:data', type : 'submit'})
            .c('field', {var : 'FORM_TYPE', type: 'hidden'})
            .c('value').t('http://jabber.org/protocol/pubsub#node_config').up().up()
            .c('field', {var : 'pubsub#title'})
            .c('value').t('Custom notifications node.').up().up()
            .c('field', { var : 'pubsub#publish_model'})
            .c('value').t('open').up().up()
            // .c('field', { var : 'pubsub#persist_items'})
            // .c('value').t('1').up().up()
            // .c('field', { var : 'pubsub#deliver_payloads'})
            // .c('value').t('1').up().up()
            
            // .c('field', { var : 'pubsub#send_last_published_item'})
            // .c('value').t('on_sub_and_presence').up().up()
            
            // .c('field', { var : 'pubsub#notification_type'})
            // .c('value').t('headline').up().up()
            // with notification_type=normal, message is stored offline. when receiver becomes online, 
            // it receives the message twice: https://github.com/processone/ejabberd/issues/827
            
            
        connection.sendIQ(conf, pubSuccess, pubError, 5000);
    });
    
    $('#do').bind('click', function () {
    });
    
    $('#delete-node').bind('click', function () {
        log('Delete node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub#owner' })
            .c('delete', { node: nodeName() });
        connection.sendIQ(pub, pubSuccess, pubError, 5000);
    });

    $('#get-node-form').bind('click', function () {
        log('Get node ' + nodeName() + ' details');
        var pub = $iq({ type: 'get', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub#owner' })
            .c('configure', { node: nodeName() });
        connection.sendIQ(pub, pubSuccess, pubError, 5000);
    });
    
    $('#subscribe-node').bind('click', function () {
        log('Subscribing to node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('subscribe', { node: nodeName(), jid : jid() });
        connection.sendIQ(pub, pubSuccess, pubError, 5000);
    });
    
    $('#list-subscriptions-node').bind('click', function () {
        log('List subscriptions from node ' + nodeName());
        var pub = $iq({ type: 'get', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub#owner' })
            .c('subscriptions', { node: nodeName() });
        connection.sendIQ(pub.tree(), pubSuccess, pubError, 5000);
    });

    // Test collection / leaf nodes 
    $('#publish-node').bind('click', function () {
        log('Publish in node ' + nodeName());
        var pub = $iq({ type: 'set', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('publish', { node: nodeName() })
            .c('item')
            .c('x', {xmlns : 'jabber:x:data'})
            .c('from').t(jid()).up()
            .c('value').t($('#node-event').val());
        connection.sendIQ(pub, pubSuccess, pubError, 5000);
    });
});

function pubSuccess(msg) {
    log('Events published correctly.')
}

function pubError(err) {
    log('An error has ocurred publishing.');
}

var pubsubUrl = 'pubsub.' + domain;

function jid() {
    return $('#jid').get(0).value;
}

function priority() {
    return $('#priority').get(0).value;
}

function nodeName() {
    return $('#node-name').get(0).value;    
};

function mucName() {
    return $('#muc-name').val() + '@conference.' + domain;    
};

function mucNick() {
    var patt = new RegExp("(.*)@");
    var nick = patt.exec(jid())[1];
    return '/' + nick;  
};

function mucMessage() {
    return $('#muc-msg').val();
}

function msgText() {
    return $('#msg-txt').val();
}

function msgTo() {
    return $('#msg-to').val();
}

function onEvent(msg) {
    log('NEW EVENT!!!');
    
    var from = $(msg).find('from').text();
    var txt = $(msg).find('value').text();
    var node = $(msg).find('items').attr('node');
    var id = $(msg).find('item').attr('id');
    
    $('#events').prepend('<p class="message"></p>');
    $('#events p:first').append('<span class="from">' + node + ':' + from + '</span>');
    $('#events p:first').append('<span class="body"> ' + txt + '</span>');
    
    // Msg deatils
    log('retrieve id: ' + id + ' node ' + node + ' from ' + from + ' txt ' + txt);
    
    if(id !== undefined ) {
    var ack = $iq({ type: 'get', to: pubsubUrl, from: jid() })
            .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
            .c('items', { node: node })
            .c('item', {id : id});
        connection.sendIQ(ack, pubSuccess, pubError, 5000);
    }
    // var rem = $iq({ type: 'get', to: pubsubUrl, from: jid() })
    //         .c('pubsub', { xmlns: 'http://jabber.org/protocol/pubsub' })
    //         .c('retract', { node: nodeName() })
    //         .c('item', {id : id});
    //     connection.sendIQ(rem, pubSuccess, pubError, 5000);
    
    return true;
}

function onMucMessage(message) {
    var from = $(message).attr('from');
    var body = $(message).children('body').text();
    var delayed = $(message).children("delay").length > 0  ||
        $(message).children("x[xmlns='jabber:x:delay']").length > 0;
    
    $('#groupchat').prepend('<p class="message"></p>');
    
    
    if(delayed) { 
        $('#groupchat p:first').addClass('delayed')
    }
    $('#groupchat p:first').append('<span class="from">' + from + '</span>');
    $('#groupchat p:first').append('<span class="body"> ' + body + '</span>');
    
    return true;
}

function onMessage(message) {
    var from = $(message).attr('from');
    var body = $(message).children('body').text();
    var delayed = $(message).children("delay").length > 0  ||
        $(message).children("x[xmlns='jabber:x:delay']").length > 0;
    
    $('#messages').prepend('<p class="message"></p>');
    
    if(delayed) { 
        $('#messages p:first').addClass('delayed')
    }
    $('#messages p:first').append('<span class="from">' + from + '</span>');
    $('#messages p:first').append('<span class="body"> ' + body + '</span>');
    
    return true;
}