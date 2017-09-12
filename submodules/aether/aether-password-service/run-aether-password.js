// "use strict";

var Muon = require("muon-core")
var aether = require("./src/aether-password").default

var muonurl = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"
var muon = Muon.create("aether-password", muonurl, muonurl, ["aether"]);

new aether(muon)