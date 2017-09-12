package io.muoncore.extension.amqp.discovery.externalbroker

import io.arivera.oss.embedded.rabbitmq.EmbeddedRabbitMq
import io.arivera.oss.embedded.rabbitmq.EmbeddedRabbitMqConfig
import io.arivera.oss.embedded.rabbitmq.bin.RabbitMqCommand
import io.muoncore.Muon
import io.muoncore.MuonBuilder
import io.muoncore.channel.impl.StandardAsyncChannel
import io.muoncore.config.MuonConfigBuilder
import io.muoncore.extension.amqp.BaseEmbeddedBrokerSpec
import io.muoncore.message.MuonMessage
import org.reactivestreams.Subscriber
import org.reactivestreams.Subscription
import org.zeroturnaround.exec.ProcessResult
import org.zeroturnaround.exec.StartedProcess
import reactor.Environment
import spock.lang.AutoCleanup
import spock.lang.Ignore
import spock.lang.IgnoreIf
import spock.lang.Specification
import spock.lang.Timeout

@Timeout(60)
class FullStackSpec extends BaseEmbeddedBrokerSpec {


  def "full amqp based stack works"() {

    Environment.initializeIfEmpty()
    StandardAsyncChannel.echoOut = true

    def svc1 = createMuon("simples")
    def svc2 = createMuon("tombola1")
    def svc3 = createMuon("tombola2")
    def svc4 = createMuon("tombola3")
    def svc5 = createMuon("tombola4")
    def svc6 = createMuon("tombola5")



    when:
    Thread.sleep(3500)
    def then = System.currentTimeMillis()
//        def response = svc1.request("request://tombola1/hello", [hello:"world"]).get(1500, TimeUnit.MILLISECONDS)
    def response = svc1.request("request://tombola1/hello", [hello: "world"]).get()
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

  private Muon createMuon(serviceName) {

    def config = MuonConfigBuilder.withServiceIdentifier(serviceName).build()

    println "Creating muon"

    MuonBuilder.withConfig(config).build()
  }

}
