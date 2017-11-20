package io.muoncore.extension.amqp.discovery.externalbroker

import io.arivera.oss.embedded.rabbitmq.EmbeddedRabbitMq
import io.arivera.oss.embedded.rabbitmq.EmbeddedRabbitMqConfig
import io.arivera.oss.embedded.rabbitmq.bin.RabbitMqCommand
import io.muoncore.Muon
import io.muoncore.MuonBuilder
import io.muoncore.channel.impl.StandardAsyncChannel
import io.muoncore.config.MuonConfigBuilder
import io.muoncore.extension.amqp.BaseEmbeddedBrokerSpec
import io.muoncore.protocol.rpc.client.RpcClient
import io.muoncore.protocol.rpc.server.HandlerPredicates
import io.muoncore.protocol.rpc.server.RpcServer
import spock.lang.Timeout

//@Ignore
@Timeout(60)
class FullStackSpec extends BaseEmbeddedBrokerSpec {


  def "full amqp based stack works"() {

    StandardAsyncChannel.echoOut = true

    def svc1 = createMuon("simples")
    def svc2 = createMuon("tombola1")
    def svc3 = createMuon("tombola2")
    def svc4 = createMuon("tombola3")
    def svc5 = createMuon("tombola4")
    def svc6 = createMuon("tombola5")

    def rpcServer = new RpcServer(svc2)
    rpcServer.handleRequest(HandlerPredicates.all()).handler {
      it.ok([hi:"there"])
    }.build()
    def rpcClient = new RpcClient(svc1)

    when:
    Thread.sleep(3500)
    def then = System.currentTimeMillis()
//        def response = svc1.request("request://tombola1/hello", [hello:"world"]).get(1500, TimeUnit.MILLISECONDS)
    def response = rpcClient.request("request://tombola1/hello", [hello: "world"]).get()
    def now = System.currentTimeMillis()

    println "Latency = ${now - then}"
//        def discoveredServices = svc3.discovery.knownServices

    then:
//        discoveredServices.size() == 6
    response != null
    response.status == 200
    response.getPayload(Map).hi == "there"

    cleanup:
    StandardAsyncChannel.echoOut = false
    svc1.shutdown()
    svc2.shutdown()
    svc3.shutdown()
    svc4.shutdown()
    svc5.shutdown()
    svc6.shutdown()
  }

  def "will reconnect to broker after broker failure"() {

    StandardAsyncChannel.echoOut = true

    def svc1 = createMuon("simples")
    def svc2 = createMuon("tombola1")

    when:
    Thread.sleep(3500)

    brokerStop()
    sleep(1000)
    brokerStart()

    sleep(2000)

    def services = svc1.discovery.serviceNames
    def services2 = svc2.discovery.serviceNames

    then:
    services.size() > 0
    services == services2

    cleanup:
    StandardAsyncChannel.echoOut = false
    svc1.shutdown()
    svc2.shutdown()
  }

  private Muon createMuon(serviceName) {

    def config = MuonConfigBuilder.withServiceIdentifier(serviceName).build()

    println "Creating muon"

    MuonBuilder.withConfig(config).build()
  }

}
