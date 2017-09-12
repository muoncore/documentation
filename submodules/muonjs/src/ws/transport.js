var _ = require("underscore");
var bichannel = require('muon-core').channel();
var uuid = require("node-uuid");

var SockJS = require("sockjs-client")
var MuonSocketAgent = require("muon-core").MuonSocketAgent
var RSVP = require('rsvp');

var BrowserTransport = function (serviceName, serverStacks, url) {

    var trans = this;
    this.url = url
    this.isOpen = false
    this.initTransport();
    
    this.ws.onclose = function() {
        logger.info("CLOSED CONNECTION, retrying ...")
        this.isOpen = false

        setTimeout(function() {
            trans.initTransport();
        }, 1000);
    }.bind(this)
};

BrowserTransport.prototype.initTransport = function() {
    logger.info("Booting transport, sock js is currently closed and buffer queue is accepting messages")

    this.ws = new SockJS(this.url);

    this.channelConnections = {};
    var transport = this;

    this.ws.onopen = function() {
        transport.isOpen = true;
        logger.info("SockJS becomes ready, draining connection buffers")
        _.each(this.channelConnections, function(connection) {
            connection.drainQueue()
        })
    }.bind(this)
    
    this.ws.onmessage = function (event) {
        logger.debug("MESSAGE RECEIVED FROM SERVER: " + JSON.stringify(event.data));
        var data = JSON.parse(event.data);
        var channelId = data.channelId;
        var connection = transport.channelConnections[channelId];
        connection.channel.rightConnection().send(data);
    };

    
    // var upstreamCallback
    // var transportErrCallback = function (err) {
    //     logger.error('[*** TRANSPORT:ERROR ***] ' + err);
    //     if (upstreamCallback) {
    //         upstreamCallback(err);
    //     }
    // }

    this.promise = new RSVP.Promise(function (resolve, reject) {
        var trans = {
            openChannel: function (remoteServiceName, protocolName) {
                return transport.openChannel(remoteServiceName, protocolName)
            },
            onError: function (cb) {
                logger.warn("Error callback passed into browser transport, this is not currently used and will be ignored")
                // upstreamCallback = cb;
            },
            shutdown: function () {
                logger.warn("shutdown() called on browser transport. This is not currently used and will be ignored")
            }
        }
        resolve(trans);
    })
}

BrowserTransport.prototype.openChannel = function(serviceName, protocolName) {

    var transport = this;

    var transportChannel = {
        channelId:uuid.v1(),
        serviceName: serviceName,
        protocolName: protocolName,
        channelOpen:true,
        outboundBuffer:[],
        drainQueue: function() {

            _.each(this.outboundBuffer, function(el) {
                this.send(el);
            }.bind(this));
            logger.trace("[***** TRANSPORT *****] send " + this.outboundBuffer.length + " pending messages");
            this.outboundBuffer = [];
        },
        shutdown: function() {
            logger.info("[***** TRANSPORT *****] CHANNEL POISONED");

            this.send({
                headers:{
                    eventType:"ChannelShutdown",
                    id:"simples",
                    targetService:"",
                    sourceService:"",
                    protocol:"",
                    "Content-Type":"application/json",
                    sourceAvailableContentTypes:["application/json"],
                    channelOperation:"CLOSE_CHANNEL"
                },
                payload:{
                    be:"happy"
                }
            });
        },
        send: function(msg) {
            try {
                if (!transport.isOpen) {
                    logger.info("[***** TRANSPORT *****] Transport is not yet ready, buffering message")
                    this.outboundBuffer.push(msg)
                } else {
                    msg.channelId = transportChannel.channelId;

                    var out = JSON.stringify(msg);

                    logger.debug("[***** TRANSPORT *****] Sending event outbound to browser transport " + out);
                    transport.ws.send(out);
                }
            } catch (err) {
                console.log("[***** TRANSPORT *****] Error received");
                console.dir(err)
            }
        }
    };

    this.channelConnections[transportChannel.channelId] = transportChannel;
    // var agentRight = bichannel.create("browser-transport-right");
    var agentLeft = bichannel.create("browser-transport-left");

    agentLeft.rightConnection().listen(function(msg) {
        logger.debug("[***** TRANSPORT *****] received outbound event");
        if (msg == "poison") {
            transportChannel.shutdown();
            return;
        }
        if(transportChannel.channelOpen) {
            transportChannel.send(msg);
        } else {
            transportChannel.outboundBuffer.push(msg);
        }
    }.bind(transportChannel));

//    new MuonSocketAgent(agentLeft, agentRight, protocolName, 1000);

    transportChannel.channel = agentLeft

    return agentLeft.leftConnection();
};


BrowserTransport.prototype.shutdown = function() {
    //TODO, more shutdowns.
};

module.exports = BrowserTransport;


function wrap(connection) {

    var wrapperChannel = bichannel.create(connection.name() + "-wrapper");

    wrapperChannel.rightConnection().listen(function(msg) {
        connection.send(msg);
    });

    connection.listen(function(msg) {
        try {
            wrapperChannel.rightConnection().send(msg);
        } catch(err) {
            logger.warn('error sending message on csp channel ' + connection);
            logger.warn(err.stack);
        }

    });

    return wrapperChannel;
}
