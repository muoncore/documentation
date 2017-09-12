

module.exports.attach = (muon) => {
    muon.addTransport("amqp", require("./transport/transport"))
    muon.addDiscovery("amqp", require("./discovery/discovery"))
}
