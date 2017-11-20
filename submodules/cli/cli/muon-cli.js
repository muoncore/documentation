#!/usr/bin/env node

var muoncore = require('muon-core');

require("muon-amqp").attach(muoncore)

var cli = require('cli').enable('status');
require('sexylog');
var url = require('url');
var Joi = require('joi');
var _ = require('underscore');
var util = require('util');
var Table = require('cli-table');
var uuid = require('uuid');

var rpc = require("./actions/rpc")
var builtin = require("./actions/builtin")
var stream = require("./actions/stream")
var event = require("./actions/event")

var cliName = "muon-cli-" + uuid.v4();
var amqpUrl = process.env.MUON_URL;


var cliobj;

cli.parse({
    // discover:   ['d', 'discover muon services'],
    raw: ['r', "Output raw, no decoration. Suitable for post processing"],
    auth: ['a', "Add an auth token to the protocol connection, if supported by the protocol. SHould be of the form {'provider': 'token':'XXX'}", "string", ""]
  },
  {
    "introspect": "Obtain introspection information for a service, showing implemented protocols and endpoints",
    "discover": "Show the currently running services",
    "rpc": "<url> <payload>",
    "stream": "<url> [configuration]>",
    "emit": "<event>",
    "replay": "<stream name> [configuration]"
  });

cli.main(function (args, options) {
  cliobj = this;

  var validAmqpUrl = Joi.validate(amqpUrl, Joi.string().uri().required());

  if (validAmqpUrl.error) {
    logger.error('amqp env variable url invalid! MUON_URL=' + amqpUrl);
    logger.error('export MUON_URL=amqp://muon:microservices@localhost:5672');
    exit();
  }
  // cliobj.ok('muon cli connected: ' + amqpUrl);
  logger.trace("rpc() args=" + JSON.stringify(args));

  switch (cli.command) {
    case "discover":
      withMuon(function (muon) {
        builtin.discover(muon, options);
      })

      break;
    case "introspect":
      withMuon(function (muon) {
        builtin.introspect(muon, options, args);
      })
      break;
    case "rpc":
      withMuon(function (muon) {
        rpc(muon, options, args);
      })
      break;
    case "stream":
      withMuon(function (muon) {
        stream.stream(muon, options, args);
      })
      break;
    case "replay":
      withMuon(function (muon) {
        stream.replay(muon, options, args);
      })
      break;
    case "emit":
      withMuon(function (muon) {
        event.emit(muon, options, args);
      })

      break;
    default:
      logger.error("Unknown command " + cli.command);
  }
});

function withMuon(exec) {
  var muon = muoncore.create(cliName, amqpUrl);
  require("muon-stack-event").create(muon)
  require("muon-stack-rpc").create(muon)
  require("muon-stack-reactive-streams").create(muon)
  exec(muon)
}

function exit() {
  process.exit(0);
}
