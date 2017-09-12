var jwt = require("jsonwebtoken")

var Muon = require("muon-core")
var Aether = require('../src/account-repository').default
var assert = require('assert');
var expect = require('expect.js');
var fs = require("fs")
var RSVP = require("rsvp")


var AMQP_URL = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"

console.log("AMQP IS " + AMQP_URL)

describe("Account Repository:", function () {

    this.timeout(10000);

    var muon
    var aether

    before(function (done) {
        muon = Muon.create("aether", AMQP_URL)
        setTimeout(done, 6000)
    });

    beforeEach(() => {
        aether = new Aether(muon)
    })

    it("creates new detail from login", function (done) {
        aether.getOrCreateAccountByLogin({
            type:"faked",
            id:"simples",
            success:true,
            detail: {
                email: "my.email@wibble.com"
            }
        }).then(function(detail) {
            assert.equal(detail.email, "my.email@wibble.com")
            done()
        })
    })

    it("getAccountByLoginId", function (done) {
        aether.accounts.push({
            logins: [{type:"faked", id:"1234"}]
        })

        var account = aether.getAccountByLoginId("faked", "1234")
        assert(account)
        done()
    })

    it("lookup existing detail from login", function (done) {
        aether.getOrCreateAccountByLogin({
            type:"faked",
            id: "simples",
            success:true,
            detail: {
                email: "my.email@wibble.com",
                name: "My Email"
            }
        }).then(function(detail) {

            aether.getOrCreateAccountByLogin({
                type:"faked",
                id: "simples",
                success:true,
                detail: {
                    email: "my.email@wibble.com"
                }
            }).then(function(detail) {
                assert.equal(detail.email, "my.email@wibble.com")
                assert.equal(detail.name, "My Email")
                done()
            }).catch((er) => console.dir(er))

        })
    })
})
