var muoncore = require('../muon/api/muoncore.js');


//
var amqpurl = "amqp://muon:microservices@localhost";
//var amqpurl = 'amqp://guest:guest@conciens.mooo.com';

logger.info('starting muon...');
var muon = muoncore.create("test-client", amqpurl);




function request() {
  var then = new Date().getTime()
  var promise = muon.request('rpc://awesomeservicequery/ping', {"search": "red"});
  promise.then(function (event) {
    var now = new Date().getTime()
    console.log("Latency is " + (now - then))
  }).catch(function(error) {
    console.dir("FAILED< BOOO " + error)
  })
}

function subscribe() {
    muon.subscribe("stream://awesomeservicequery/ticktock", {},
        function(data) {
            logger.error("Data...")
            console.dir(data)
        },
        function(error) {
            logger.error("Errored...")
            console.dir(error)
        },
        function() {
            logger.warn("COMPLETED STREAM")
        }
    )
}


request()

setTimeout(request, 6000)
setTimeout(request, 6000)




// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
// subscribe()
//
//
