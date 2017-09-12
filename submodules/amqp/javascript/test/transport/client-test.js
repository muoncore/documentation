var bichannel = require('muon-core').channel();
var client = require('../../src/transport/client.js');
var server = require('../../src/transport/server.js');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('uuid');
var messages = require('muon-core').Messages;
var amqp = require('../../src/transport/amqp-api.js');
var amqplib = require('amqplib/callback_api');

var AmqpDiscovery = require("../../src/discovery/discovery");
var BaseDiscovery = require("muon-core").BaseDiscovery;

describe("client test:", function () {

    this.timeout(20000);

      it("client deletes muon socket queues on channel_op equals closed message", function (done) {

        var serverName = 'serverabc123';
        var url = process.env.MUON_URL || "amqp://muon:microservices@localhost";

        var deleteCalled = 0;
        var discovery = {
            discoverServices: function(cb) {
                var services = {find: function() {return {identifier: serverName}}};
                cb(services);
            },
            serviceList: [{identifier: serverName}]
        }
        var amqpApi = {
          delete: function(queueName) {
              deleteCalled++;
              expect(queueName).to.contain(serverName);
              if (deleteCalled == 2) done(); // it's been called twice
          },
          outbound: function() {
            return {send: function(){}};
          },
          inbound: function() {
            return {listen: function(cb) {cb({headers: {handshake: 'accepted'}})}}
          }
        };

        var muonClientChannel = client.connect(serverName, 'rpc', amqpApi, discovery);

        muonClientChannel.send(messages.shutdownMessage());



      });

});
