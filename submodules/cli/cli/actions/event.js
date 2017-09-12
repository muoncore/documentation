
var Table = require('cli-table');
var _ = require('underscore');
var util = require("../util")

module.exports.emit = function (muon, options, args) {

    if (process.stdin.isTTY) {
        processCommand(muon, args, function(data) {
            render([data])
        })
    } else {
        processStreamInput(muon, args)
    }
}

function render(data) {
    var table = new Table({
        head: ['STATUS', 'ORDER ID', 'EVENT TIME', 'DESCRIPTION']
        , colWidths: [12, 25, 25, 70]
    });

    for (var k in data) {
        table.push(data[k])
    }
    console.log(table.toString())
    util.exit()
}

function processStreamInput(muon, args) {

    var streamCompleted = false;

    process.stdin.pipe(require('split')()).on('data', processLine).on("end", function() {
        streamCompleted = true;
    });

    var commandsOutstanding = 0;
    var paused = false

    var data = []

    function processLine (line) {
        if (line != null && line.length > 0) {
            try {
                if (commandsOutstanding > 100) {
                    logger.warn("Pausing event input")
                    paused=true
                    process.stdin.pause()
                }
            } catch(e) {
                logger.error("error", e)
            }
            commandsOutstanding++;
            processCommand(muon, [line], function(funcdata){
                logger.warn("Processing command!")
                commandsOutstanding--;
                if (commandsOutstanding < 80 && paused) {
                    logger.warn("Resuming event input")
                    paused = false
                    process.stdin.resume()
                }
                data.push(funcdata)
                if (commandsOutstanding == 0 && streamCompleted) {
                    render(data)
                }
            });
        }
    }
}

function processCommand(muon, args, done) {
    if (! args[0]) args[0] = '{}';
    var payload = JSON.parse(args[0]);

    payload["service-id"] = "cli"

    muon.emit(payload).then(function(result) {
        logger.trace("EVENT RESPONSE: \n" + JSON.stringify(result));
        done([result.status,
            result.orderId,
            result.eventTime, result.cause])
    }).catch(function(error) {
        if ((typeof error) === "object") {
            done([error.status || "",
                error.orderId || "",
                error.eventTime || "", error.cause || ""])
        } else {
            done(["", "", "", JSON.stringify(error)])
        }
    })
}
