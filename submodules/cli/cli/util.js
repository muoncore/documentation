

module.exports.exit = function () {
    process.exit(0);
}



module.exports.withMuon = function (exec) {
    var muoncore = require('muon-core');
    var amqpUrl = process.env.MUON_URL;
    var cliName = "muon-cli"
    var muon = muoncore.create(cliName, amqpUrl);
    exec(muon)
}