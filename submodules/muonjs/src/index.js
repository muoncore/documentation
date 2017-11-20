require("sexylog")

var _ = require("underscore")
var http = require("http")
var Muon = require("muon-core")
var transport = require("./ws/transport")
var discovery = require("./ws/discovery")
var sockjs_opts = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"};

module.exports.gateway = function(conf) {
    
    logger.info("Starting muon.js gateway with config " + JSON.stringify(conf))
    
    var muon = conf.muon
    var app=conf.app
    var port = conf.port || 9999
    
    console.dir(muon)

    var discovery = require('sockjs').createServer(sockjs_opts);
    var transport = require('sockjs').createServer(sockjs_opts);

    if (app == undefined) {
        logger.info("No existing application passed in, will create a new http endpoint on port " + port)
        var server = http.createServer();
        server.addListener('upgrade', function(req,res){
            res.end();
        });
        discovery.installHandlers(server, {prefix:'/discover'});
        transport.installHandlers(server, {prefix:'/transport'});
        server.listen(port, '0.0.0.0');
    }

    discovery.on('connection', function(ws) {

        function sendDiscovery() {
            ws.send(JSON.stringify([

                {
                    identifier:"simples"
                }
            ]), function() {  })
        }

        logger.info("Discovery connected")
        ws.on('data', function(message) {
            logger.info("Discovery received data: " + JSON.stringify(message));
        });
        var interval = setInterval(sendDiscovery, 2000);
        ws.on("close", function() {
            console.log("websocket connection close")
            clearInterval(interval);
        })

        sendDiscovery()
    });

    transport.on("connection", function(ws) {
        console.log("Transport connected")
    
        var connections = {};
    
        console.log("websocket transport connection open")
    
        ws.on('data', function message(data) {
            
            muon.infrastructure().getTransport().then(function(transport) {
                var myData = JSON.parse(data);
                
                var channelId = myData.channelId;
                var targetService = myData["target_service"];

                var protocol = myData.protocol;
                // TODO, this should be an optional override.
                myData.origin_service = muon.infrastructure().config.serviceName;

                var internalChannel = connections[channelId];

                if (targetService == "n/a" && !internalChannel) {
                    logger.debug("Got Channel Shutdown for non existent channel, discarding" + JSON.stringify(myData))
                    return
                }
                
                logger.info("ROUTING MESSAGE " + JSON.stringify(myData))

                if (myData.channel_op == "closed" && internalChannel != undefined) {
                    logger.debug("SHUTDOWN CHANNEL BY CLIENT REQUEST")
                    internalChannel.send(Muon.Messages.shutdownMessage())
                    internalChannel.close()
                    delete connections[channelId]
                } else {
                    if (internalChannel == undefined) {
                        logger.debug("Establishing new channel to " + targetService + protocol);
                        internalChannel = transport.openChannel(targetService, protocol);
                        connections[channelId] = internalChannel
                        internalChannel.listen(function (msg) {
                            if (msg.step == "ChannelShutdown" || msg.step == "ChannelFailure") {
                                logger.debug("Channel id " + channelId + " is closed at the transport level. Removing from routing list")
                                internalChannel.close()
                                delete connections[channelId]
                            }
                            logger.debug("Sending message back down ws for channel " + channelId);
                            msg["channelId"] = channelId;
                            ws.write(JSON.stringify(msg));
                        });
                    }
                    // console.log("Routing message on channel: " + channelId);
                    delete myData.channelId;
                    internalChannel.send(myData);
                }
            })
        });
    
        ws.on("close", function() {
            logger.debug("Client has disconnected")
            _.each(connections, function(conn) {
                conn.send(Muon.Messages.shutdownMessage())
                conn.close()
            })
            connections = null
        })
    });

    return {
        shutdown: function() {
        }
    }
}

module.exports.client = function(conf) {
    logger.info("Starting client with config " + JSON.stringify(conf))
    console.dir(conf)
    if (!conf) { conf = {} }
    //detect the browser setup. 

    // var port = window.location.port
    var host = window.location.hostname

    var port = conf.port || 9999
    var scheme = window.location.protocol

    var basews = scheme + "//" + host + ":" + port
    
    var serviceName = "browser-instance"
    var websockurl = basews + "/transport"
    var discoverurl = basews + "/discover"

    var serverStacks = new Muon.ServerStacks(serviceName);

    var trans = new transport(serviceName, serverStacks, websockurl)
    
    var infrastructure = {
        config: {},
        discovery: new discovery(discoverurl),
        transport: trans,
        getTransport: function() { return trans.promise },
        serverStacks: serverStacks,
        shutdown: function() {
            //shutdown stuff...
        }
    }
    
    var muon = Muon.api(serviceName, infrastructure)
    require("muon-stack-rpc").create(muon)
    require("muon-stack-reactive-streams").create(muon)
    return muon;
}