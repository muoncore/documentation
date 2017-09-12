var muoncore = require("muon-core");
var assert = require('assert');
var expect = require('expect.js');
var RQ = require("async-rq")

describe("Gateway tests", function () {

    this.timeout(3000000);
    var serviceName = "example-service";
    var amqpurl = process.env.MUON_URL || "amqp://muon:microservices@localhost";

    var muon
    var muon2
    var gw

    before(function () {
        global.window = {
            location: {
                hostname: "localhost"
            }}

        muon = muoncore.create("gateway-testing", amqpurl);
        muon.handle('/tennis', function (event, respond) {
            logger.warn('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.warn('rpc://service/tennis server responding to event=' + JSON.stringify(event));
            respond("pong");
        });

        muon2 = muoncore.create("target-service-muonjs", amqpurl);
        muon2.handle('/tennis', function (event, respond) {
            logger.warn('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.warn('rpc://service/tennis server responding to event=' + JSON.stringify(event));
            respond("pong");
        });

        gw = require("../src/index").gateway({ port: 56078, muon: muon})
    });

    after(function () {
        if (gw) gw.shutdown()
        if (muon) muon.shutdown();
        if (muon2) muon2.shutdown();
    });


    it("functional check", function (done) {

        var clientmuon = require("../src/index").client({port: 56078})

        var promise = clientmuon.request('rpc://target-service-muonjs/tennis', "ping");

        promise.then(function (response) {
            logger.warn("rpc://example-client server response received! response=" + JSON.stringify(response));
            logger.warn("muon promise.then() asserting response...");
            logger.info("Response is " + JSON.stringify(response))
            assert(response, "request response is undefined");
            assert.equal(response.body, "pong", "expected 'pong' but was " + response.body)
            done();
        }, function (err) {
            logger.error("muon promise.then() error!\n" + err.stack);
            done(err);
        }).catch(function (error) {
            logger.error("muoncore-test.js promise.then() error!:\n" + error.stack);
            done(error);

        });
    });
    it("soak test", function (done) {
        var clientmuon = require("../src/index").client({port: 56078})

        var soak = RQ.sequence([
            RQ.parallel([
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
            ]),
            requestFactory(clientmuon),
            requestFactory(clientmuon),
            delay(6000),
            requestFactory(clientmuon),
            requestFactory(clientmuon),
            delay(10000),
            requestFactory(clientmuon),
            requestFactory(clientmuon),
            delay(20000),
            RQ.parallel([
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
                requestFactory(clientmuon),
            ]),
            delay(15000)
        ])

        subscribe(clientmuon, "fast-as-possible")
        // subscribe(clientmuon, "large-payload")
        // subscribe(clientmuon, "fast-as-possible")

        // soak(function (data) {
        //     console.log("SOAK TEST DONE")
        //     console.dir(data)
        //     done()
        // })
    })
});


function delay(milliseconds) {
    return function requestor(callback, value) {
        var timeout_id = setTimeout(function () {
            return callback(value);
        }, milliseconds);
        return function cancel(reason) {
            return clearTimeout(timeout_id);
        };
    };
}

function requestFactory(muon) {
    return function request(done, val) {
        logger.info('Requesting data ');
        var then = new Date().getTime()
        var promise = muon.request('rpc://env-node/string-response', {"search": "red"});
        promise.then(function (event) {
            var now = new Date().getTime()
            console.log("Response is " + JSON.stringify(event))
            console.log("Latency is " + (now - then))
            done()
        }).catch(function (error) {
            console.dir("FAILED< BOOO " + error)
            done()
        })
    }
}

function subscribe(muon, end) {
    muon.subscribe("stream://env-jvm/" + end, {},
        function (data) {
            console.dir(data)
        },
        function (error) {
            logger.error("Errored...")
            console.dir(error)
        },
        function () {
            logger.warn("COMPLETED STREAM")
        }
    )
}
