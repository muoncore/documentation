
var Table = require('cli-table');
var _ = require('underscore');
var util = require("../util")
var colors = require("colors")

module.exports.introspect = function (muon, options, args) {

    var service = args[0];
    muon.introspect(service, function(response) {

        var header = new Table()

        var protocolNames = _.collect(response.protocols, function(it) { return it. protocolScheme })

        header.push(
            { 'Service Name': response.serviceName },
            { 'Protocols': protocolNames.join(", ") }
        );

        console.log(colors.bold('\n## Introspection Report ##\n'));
        console.log(header.toString())

        _.each(response.protocols, function(proto) {

            var protoheader = new Table()

            console.log(colors.bold('\n#### ' + proto.protocolName + ' ##\n'));
            protoheader.push(
                { 'Protocol Name': proto.protocolName },
                { 'Scheme': proto.protocolScheme },
                { 'Description': proto.description }
            );

            console.log(protoheader.toString())

            var table = new Table({
                head: ['Endpoint', 'Description']
                , colWidths: [30, 30]
            });

            if (proto.operations.length > 0 && proto.operations != "N/A") {
                _.each(proto.operations, function (op) {

                    var doc = op.doc
                    if (doc == null) doc = ''

                    table.push(
                        [op.resource, doc]
                    );
                });
                console.log(colors.green('\n' + proto.operations.length + ' operations available\n'));
                console.log(table.toString())
            } else {
                console.log(colors.bold(colors.red('\nNo operations are available for this protocol, or they cannot be read\n')));
            }
        })

        util.exit();
    });
}

module.exports.introspect.complete = function(data, done) {
    withMuon(function (muon) {
        var discovery = muon.discovery();
        discovery.discoverServices(function(services) {
            var serviceList = _.map(services.serviceList, function(service) {
                return service.identifier
            });

            done(null, serviceList);
            exit()
        });
    })
}

module.exports.discover = function (muon, options) {
    var discovery = muon.discovery();

    if (options.raw) {
      discovery.discoverServices(function (services) {
        var data = []
        _.each(services.serviceList, function (service) {
          data.push(
            {serviceName:service.identifier, tags:service.tags, transports:service.connectionUrls.join()}
          );
        });

        console.log(JSON.stringify(data));
        util.exit();
      });
    } else {
      var table = new Table({
        head: ['SERVICE NAME', 'TAGS', 'TRANSPORT']
        , colWidths: [30, 30, 70]
      });

      discovery.discoverServices(function (services) {
        _.each(services.serviceList, function (service) {
          table.push(
            [service.identifier, service.tags, service.connectionUrls.join()]
          );
        });

        console.log(table.toString());
        util.exit();
      });
    }
}


var muoncore = require('muon-core');
var amqpUrl = process.env.MUON_URL;
var cliName = "muon-cli"

function withMuon(exec) {
    var muon = muoncore.create(cliName, amqpUrl);
    exec(muon)
}
