
//# tag::init[]
var Muon = require("muon-core")
var muonurl = process.env.MUON_URL || "amqp://muon:microservices@rabbitmq"

logger.info("Muon is enabled, booting up using url " + muonurl)
var muon = Muon.create("orders", muonurl);                              //<1>
//# end::init[]


//# tag::stream-connection[]

var currentMenu = {}

function connectMenu() {
  console.log("Attempting to connect to Menu live stream")
  muon.subscribe("stream://menu/live", {}, (menu) => {                         //<1>
    currentMenu = menu
    console.log("Menu Updated")
  }, (error) => {
    console.log("Disconnected from Menu service, reconnecting ", error)
    setTimeout(connectMenu, 10000)                                             //<2>
  }, (complete) => {
    console.log("Stream was closed by the remote service, reconnecting ... ")
    setTimeout(connectMenu, 10000)
  })
}
connectMenu()                                                                  //<3>

//# end::stream-connection[]

//# tag::order-rpc[]

muon.handle("/order", (data, response) => {                          //<1>

  var orderRequest = data.body                                       //<2>

  var orderResponse = JSON.parse(JSON.stringify(orderRequest))       //<3>

  orderResponse.total = orderResponse.items.reduce((accum, current) => {  //<4>
    var item = currentMenu.items.find((item) => item.id == current.id)
    return accum + item.price * current.value;
  }, 0);

  response(orderResponse)
})

//# end::order-rpc[]
