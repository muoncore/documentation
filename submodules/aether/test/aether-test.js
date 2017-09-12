var jwt = require("jsonwebtoken")

var Muon = require("muon-core")
var Aether = require('../src/aether').default
var AccountRepository = require('../src/account-repository').default
var assert = require('assert');
var expect = require('expect.js');
var fs = require("fs")
var RSVP = require("rsvp")

var AMQP_URL = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"

var fakeProviders = function() {

    this.authorise = function(principal) {
        return new RSVP.Promise((resolve, reject) => {
            assert.equal(principal.value, "wibble")
            resolve({
                id: "12345",
                type:"fake",
                success:true,
                detail: {
                    email: "someone"
                }
            })
        })
    }
}

describe("Aether Server:", function () {

    this.timeout(10000);

    var muon
    var publicKey = fs.readFileSync('./test/testing.crt')
    var aether

    before(function (done) {
        muon = Muon.create("aether", AMQP_URL)
        aether = new Aether(muon, new fakeProviders(), new AccountRepository(muon))
        setTimeout(done, 6000)
    });

    it("can load pubkey", function (done) {
        muon.request("rpc://aether/pubkey", {}).then((val) => {
            assert(val.body.indexOf("BEGIN RSA PUBLIC KEY"))
            done()
        })
    })

    //can exchange a principal for an Aether JWT token
    it("can auth principal", function (done) {
        muon.request("rpc://aether/auth", {
            type:"fake",
            value: "wibble"
        }).then((val) => {
            console.dir(val)
            assert(val.body.success)
            assert(val.body.token)
            assert(val.body.detail)
            done()
        }).catch((er) => console.dir(er))
    })

    //can verify an existing token is valid
    it("can verify an existing token is valid and give the user detail for it", function (done) {

        muon.request("rpc://aether/auth", {
            type:"fake",
            value: "wibble"
        }).then((val) => {

            console.log("Verifying token " + JSON.stringify(val))

            muon.request("rpc://aether/verify", val.body.token).then((val) => {
                var token = val.body

                assert(token.verified)
                assert(token.payload.email, "my.name@hello.com")
                done()
            }).catch((er) => console.dir(er))
        }).catch((er) => console.dir(er))
    })
})
