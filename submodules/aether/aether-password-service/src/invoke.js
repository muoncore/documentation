var jwt = require("jsonwebtoken")

var muon = require("muon-core")
var assert = require('assert');
var expect = require('expect.js');
var fs = require("fs")
var Sodium = require("sodium").api
var AMQP_URL = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"


// var password = new Buffer(128)
// password.fill(null)
// password.write("mypass", "utf8")


// var strpw = hashedpw.toString("utf-8")
//
// console.log("PWD:" + strpw)
//
// var hash = new Buffer(128)
// hash.fill(null)
// hash.write(strpw, "utf-8")

var hashedpw = Sodium.crypto_pwhash_str(
  Buffer.from("mypass", "utf8"),
  Sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
  Sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE);


var pwd = hashedpw.toString("utf8")

var hash = new Buffer(128)
hash.fill(null)
hash.write(pwd, "utf8")

var inPass = Buffer.from("mypass", 'utf8');

var isValid = Sodium.crypto_pwhash_str_verify(hash, inPass);

console.log("VAL IS " + isValid)

// assert(isValid)

// var muon  = muon.create("myclient", AMQP_URL)
//
// var aether = new aetherclient(muon)
//
//
//
// muon.request("rpc://aether-password/register", {
//   type:"password",
//   username: "david",
//   password: "faked"
// }).then((val) => {
//   console.dir(val)
//   var user = aether.getUser("Happy")
//   console.log("User is " + JSON.stringify(aether.userdb))
//   assert(user)
//   done()
// }).catch((er) => console.dir(er))
//
//

//
//
// setTimeout(function() {
//   aether.login({
//     type:"password",
//     username: "david",
//     password: "faked"
//   }).then((auth) => {
//     console.log("GOT DATAZ " + JSON.stringify(auth))
//     //
//     // aether.deepVerify(auth.token).then((dat) => console.dir(dat)).catch((er) => console.dir(er))
//
//     // muon.requestWithAuth("rpc://stream-test/in", {}, auth).then((ret) => console.dir(ret)).catch((err) => console.dir(err))
//
//   }).catch((err) => logger.error(err))
//
//
// }, 500)
