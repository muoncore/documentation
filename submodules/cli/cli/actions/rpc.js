var Table = require('cli-table');
var _ = require('underscore');
var util = require("../util")

module.exports = function (muon, options, args) {
  var url = args[0]
  var payload = args[1]

  var auth = options.auth

  if (!_.contains(url, "rpc://")) {
    // broken down format
    url = "rpc://" + args[0] + args[1]
    payload = args[2]
  }

  if (!payload) payload = ' ';

  if (auth) {
    muon.requestWithAuth(url, payload, JSON.parse(auth), processResponse);
  } else {
    // console.log("NO AUTH")
    muon.request(url, payload, processResponse);
  }

  function processResponse(response) {
    logger.trace("RPC RESPONSE: \n" + JSON.stringify(response));
    var table = new Table({
      head: ['STATUS', 'CONTENT/TYPE', 'BODY']
      , colWidths: [12, 30, 60]
    });
    var rawdata = []

    var status = (response.status) ? response.status : "N/A";
    var content_type = (response.content_type) ? response.content_type : "N/A";
    var body = (response.body) ? response.body : "N/A";

    var bodyString = JSON.stringify(body);

    if (options.raw) {
      console.log(bodyString)
    } else {
      table.push(
        [status, content_type, bodyString]
      );
      if (response) {
        console.log(table.toString());
        console.log('\n========= RESPONSE FULL BODY: ============================================================================\n');
        console.dir(body);
        console.log('\n');
      } else {
        console.log("no results");
        console.log(JSON.stringify(response));
      }
    }
    util.exit();
  }
}




module.exports.complete = function (data, done) {
  util.withMuon(function (muon) {

    switch (data.words) {
      case 2:
        var discovery = muon.discovery();

        discovery.discoverServices(function (services) {
          var serviceList = _.map(services.serviceList, function (service) {
            return service.identifier
          });

          done(null, serviceList);
          util.exit()
        })
        break
      case 3:
        muon.introspect(data.prev, function (response) {

          var rpcProto = _.find(response.protocols, function (prot) {
            return prot.protocolScheme == "rpc"
          })

          var endpointList = _.map(rpcProto.operations, function (op) {
            return op.resource
          });

          done(null, endpointList);
          util.exit()
        })
        break
    }
  })
}
