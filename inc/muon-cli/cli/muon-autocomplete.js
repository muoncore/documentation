#!/usr/bin/env node

var _ = require("underscore")


var rpc = require("./actions/rpc")
var builtin = require("./actions/builtin")
var stream = require("./actions/stream")
var event = require("./actions/event")

var tab = require('tabtab')({
    name: 'program',
    cache: false
});

tab.on('introspect', builtin.introspect.complete)
// tab.on('rpc', rpc.complete)

// General handler. Gets called on `program <tab>` and `program stuff ... <tab>`
tab.on('program', function(data, done) {
    // General handler

    if (data.words == 1) {
        done(null, ['discover', 'introspect', "rpc", "stream", "emit", "replay"]);
    }

    if (data.words > 1) {
        var cmd = data.line.split(" ")[1]
        switch(cmd) {
            case "rpc":
                rpc.complete(data, done)
                break
            case "stream":
                stream.complete(data, done)
                break
            case "emit":
                event.emit.complete(data, done)
                break
            case "replay":
                stream.replay.complete(data, done)
                break
        }
    }
})

tab.start()
