var amqpTransport = require('../../src/transport/transport.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('muon-core').Messages;
var bichannel = require('muon-core').channel();
// var builder = require("../../../muon/infrastructure/builder");
var AmqpDiscovery = require("../../src/discovery/discovery");
var BaseDiscovery = require("muon-core").BaseDiscovery;
var uuid = require("uuid")

describe("muon transport test: ", function () {

    this.timeout(10000);

    after(function () {
        //bi-channel.closeAll();
    });

    // it("client server negotiate handshake", function (done) {
    //     var server = uuid.v4()
    //     var url = "amqp://muon:microservices@localhost";
    //
    //     var event = messages.muonMessage("PING", 'testclient', 'server', 'test', "test.request");
    //
    //     var fakeServerStackChannel = bichannel.create("fake-serverstacks");
    //     var fakeServerStacks = {
    //         openChannel: function (msg) {
    //             console.log("SERVER STACKS OPEN!")
    //             return fakeServerStackChannel.rightConnection();
    //         }
    //     }
    //     var discovery = new BaseDiscovery(new AmqpDiscovery(url));
    //     discovery.advertiseLocalService({
    //         identifier: server,
    //         tags: [],
    //         codecs: ["application/json"],
    //         //TODO, more intelligent geenration of connection urls by asking the transports
    //         connectionUrls: [url]
    //     })
    //     var transportPromise = amqpTransport.create(server, url, fakeServerStacks, discovery);
    //
    //     transportPromise.then(function (muonTransport) {
    //         console.log('********************* transportPromise.then(): getting channel handle');
    //         var transportChannel = muonTransport.openChannel(server, 'rpc');
    //         console.log("STARTING TO LISTENT")
    //         console.log('********************* sending event on transport channel: ');
    //         transportChannel.send(event);
    //         console.log('test: wait for response from remote service ' + server);
    //         try {
    //             fakeServerStackChannel.leftConnection().listen(function (event) {
    //                 console.log('********** transport.js transportChannel.listen() event received ' + JSON.stringify(event));
    //                 var payload = messages.decode(event.payload);
    //                 console.log('test: typeof event.payload: ' + (typeof event.payload));
    //                 assert.equal(payload, 'PING');
    //                 done();
    //             }, function (err) {
    //                 logger.error(err.stack);
    //             });
    //         } catch (e) {
    //             console.log("AN ERROR WAS THROWN")
    //             console.dir(e)
    //         }
    //
    //     });
    //
    //
    // });


});
