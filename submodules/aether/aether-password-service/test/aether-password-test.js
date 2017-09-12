var jwt = require("jsonwebtoken")

var Muon = require("muon-core")
var Aether = require('../src/aether-password').default
var assert = require('assert');
var expect = require('expect.js');
var fs = require("fs")

var AMQP_URL = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"

describe("Aether Password Service:", function () {

    this.timeout(12000);

    var muon
    var aether

    before(function (done) {
        muon = Muon.create("aether-password", AMQP_URL)
        aether = new Aether(muon)
        setTimeout(done, 6000)
    });

    it("can register", function (done) {
        muon.request("rpc://aether-password/register", {
            type:"password",
            username: "Happy",
            password: "faked"
        }).then((val) => {
            console.dir(val)
            var user = aether.getUser("Happy")
          console.log("User is " + JSON.stringify(aether.userdb))
            assert(user)
            done()
        }).catch((er) => console.dir(er))
    })

    it("can auth via password", function (done) {

        aether.addUser({
            username:"simples", passwordHash: "$argon2i$v=19$m=32768,t=4,p=1$0A5RlSKpYKPSBiMQ1HAMyw$XneaP4Lip9fvUBOraJx7mrE9anSJorw/95ppkVBqyvY"
        })

        muon.request("rpc://aether-password/auth", {username: "simples", password: "happy"}).then((val) => {
            console.dir(val)
            assert(val.body.success)
            assert.equal(val.body.type, "password")
            assert.equal(val.body.detail.username, "simples")
            assert.equal(val.body.type, "password")
            done()
        }).catch((er) => {
            console.log("ERROR")
            console.dir(er)
        })
    })
    it("full auth", function (done) {

      muon.request("rpc://aether-password/register", {
        type:"password",
        username: "simples",
        password: "mypass"
      }).then((val) => {
        console.log("Starting auth")
        muon.request("rpc://aether-password/auth", {username: "simples", password: "mypass"}).then((val) => {
          console.dir(val)
          assert(val.body.success)
          assert.equal(val.body.type, "password")
          assert.equal(val.body.detail.username, "simples")
          assert.equal(val.body.type, "password")
          done()
        }).catch((er) => {
          console.log("ERROR")
          console.dir(er)
        })
      }).catch((er) => console.dir(er))
    })
})
