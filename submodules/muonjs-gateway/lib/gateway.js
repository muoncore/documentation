
require("sexylog")

var Muon = require("muon-core");

require("muon-amqp").attach(Muon)

module.exports.create = function(gwport) {

    var muon = Muon.create("muon-gateway", process.env.MUON_URL || "amqp://muon:microservices@rabbitmq");
    var muonjs = require("muonjs").gateway({port: gwport, muon:muon})

    // muon.handle('/', function (event, respond) {
    //     respond("This is the gateway speaking")
    // });

    console.log("Started muon/ websocket gateway. MuonJS can connect to port " + gwport)

}
