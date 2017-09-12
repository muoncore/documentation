// "use strict";

var Muon = require("muon-core")
var aether = require("./src/aether").default
var AccountRepository = require("./src/account-repository").default
var LoginProvider = require("./src/login-providers").default

var muonurl = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"
var muon = Muon.create("aether", muonurl, muonurl, ["aether"]);

new aether(muon, new LoginProvider(muon), new AccountRepository(muon))


/**
 *
 * password provider - hash & salt
 *
 * password provider, event source & persist locally?
 *
 * aether, event source
 * aether persist locally?
 *
 * aether. update user details
 *
 * aether, user detail service?  source of permission information?
 *
 *
 * build a web client for this
 *
 *  - password login & register
 *  - google social login
 *  - facebook social login
 *
 * pass provider, ensure we can't overwrite an existing login, without the correct auth being set. (or admin?)
 *
 */




