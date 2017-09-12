package io.muoncore.extension.amqp.externalbroker

import io.muoncore.MultiTransportMuon
import io.muoncore.Muon
import io.muoncore.channel.ChannelConnection
import io.muoncore.channel.impl.StandardAsyncChannel
import io.muoncore.codec.json.GsonCodec
import io.muoncore.codec.json.JsonOnlyCodecs
import io.muoncore.config.AutoConfiguration
import io.muoncore.descriptors.ProtocolDescriptor
import io.muoncore.extension.amqp.*
import io.muoncore.extension.amqp.discovery.AmqpDiscovery
import io.muoncore.extension.amqp.rabbitmq09.RabbitMq09ClientAmqpConnection
import io.muoncore.extension.amqp.rabbitmq09.RabbitMq09QueueListenerFactory
import io.muoncore.memory.discovery.InMemDiscovery
import io.muoncore.message.MuonInboundMessage
import io.muoncore.message.MuonMessage
import io.muoncore.message.MuonMessageBuilder
import io.muoncore.protocol.ServerProtocolStack
import io.muoncore.transport.ServiceCache
import spock.lang.AutoCleanup
import spock.lang.Shared
import spock.util.concurrent.PollingConditions

class RemoteServiceFailureConditionsSpec extends BaseEmbeddedBrokerSpec {

    @AutoCleanup("shutdown")
    @Shared
    Muon muon1

    @AutoCleanup("shutdown")
    @Shared
    Muon muon2

    def setupSpec() {
        muon2 = muon("targetservice")
        println "Made Muon 1"
        muon1 = muon("clientservice")
        println "Made Muon 2b"
    }

    def "when remote service stops and starts, will reconnect and be contactable"() {
        def sendToClient

        ChannelConnection connection = Mock(ChannelConnection) {
            receive(_) >> {
                println "ESTABLISHING A CONNECTION"
                sendToClient = new ChannelFunctionExecShimBecauseGroovyCantCallLambda(it[0])
                //auto respond on contact to give something easy to test
                Thread.start {
                    sleep(500)
                    sendToClient(outbound("awesome", "rpc"))
                }
            }
        }

        def protocol = Mock(ServerProtocolStack) {
            createChannel() >> connection
            getProtocolDescriptor() >> new ProtocolDescriptor("rpc", "rpc", "hello", [])
        }

        muon2.protocolStacks.registerServerProtocol(protocol)

        MuonInboundMessage msg

        StandardAsyncChannel.echoOut = true

        def channel = muon1.transportClient.openClientChannel()

        def failMsg

        channel.receive {
            println "CHANNEL == $msg"
            msg = it
            if (msg.channelOperation == MuonMessage.ChannelOperation.closed) {
                failMsg = it
            }
        }

        Thread.start {
            20.times {
                channel.send(outbound("targetservice", "rpc"))
                sleep 100
            }
        }

        when: "stop the broker and restart"
        println "SHUTTING DOWN MUON2"
        muon2.shutdown()

        sleep(3000)
        println "Createing new instance of 'targetservice'"
        muon2 = muon("targetservice")
        muon2.protocolStacks.registerServerProtocol(protocol)

        sleep(1000)

        Thread.start {
            20.times {
                channel.send(outbound("targetservice", "rpc"))
                sleep 100
            }
        }

        sleep 5000
        then:

        new PollingConditions(timeout: 3).eventually {
            println "FAIL == $failMsg"
            failMsg != null
        }

        cleanup:
        StandardAsyncChannel.echoOut = false
    }

    def muonServer() {
        new AmqpDiscovery(new RabbitMq09QueueListenerFactory())
    }

    def outbound(String service, String protocol) {
        MuonMessageBuilder
                .fromService("localService")
                .toService(service)
                .step("somethingHappened")
                .protocol(protocol)
                .contentType("application/json")
                .payload(new GsonCodec().encode([:]))
                .build()
    }

    private def muonDisco() {

        def connection = new RabbitMq09ClientAmqpConnection("amqp://muon:microservices@localhost:6743")
        def queueFactory = new RabbitMq09QueueListenerFactory(connection.channel)

        new AmqpDiscovery(queueFactory, connection, new ServiceCache(), new JsonOnlyCodecs())
    }


    private def muon(serviceName) {

        def connection = new RabbitMq09ClientAmqpConnection("amqp://muon:microservices@localhost:6743")
        def connection2 = new RabbitMq09ClientAmqpConnection("amqp://muon:microservices@localhost:6743")
        def queueFactory = new RabbitMq09QueueListenerFactory(connection.channel)
        def serviceQueue = new DefaultServiceQueue(serviceName, connection)
        def channelFactory = new DefaultAmqpChannelFactory(serviceName, queueFactory, connection)

        def svc1 = new AMQPMuonTransport(
                "amqp://muon:microservices@localhost:6743", serviceQueue, channelFactory)

        def disco = new AmqpDiscovery(new RabbitMq09QueueListenerFactory(connection2.channel), connection2, new ServiceCache(), new JsonOnlyCodecs())
        disco.start()
        def config = new AutoConfiguration(serviceName: serviceName)
        def muon = new MultiTransportMuon(config, disco, [svc1], new JsonOnlyCodecs())

        return muon
    }
}
