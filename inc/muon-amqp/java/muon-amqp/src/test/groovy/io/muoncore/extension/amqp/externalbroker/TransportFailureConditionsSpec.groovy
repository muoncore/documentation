package io.muoncore.extension.amqp.externalbroker

import io.muoncore.MultiTransportMuon
import io.muoncore.Muon
import io.muoncore.channel.ChannelConnection
import io.muoncore.channel.impl.StandardAsyncChannel
import io.muoncore.codec.json.GsonCodec
import io.muoncore.codec.json.JsonOnlyCodecs
import io.muoncore.config.AutoConfiguration
import io.muoncore.descriptors.ProtocolDescriptor
import io.muoncore.extension.amqp.AMQPMuonTransport
import io.muoncore.extension.amqp.BaseEmbeddedBrokerSpec
import io.muoncore.extension.amqp.ChannelFunctionExecShimBecauseGroovyCantCallLambda
import io.muoncore.extension.amqp.DefaultAmqpChannelFactory
import io.muoncore.extension.amqp.DefaultServiceQueue
import io.muoncore.extension.amqp.rabbitmq09.RabbitMq09ClientAmqpConnection
import io.muoncore.extension.amqp.rabbitmq09.RabbitMq09QueueListenerFactory
import io.muoncore.memory.discovery.InMemDiscovery
import io.muoncore.message.MuonInboundMessage
import io.muoncore.message.MuonMessage
import io.muoncore.message.MuonMessageBuilder
import io.muoncore.protocol.ServerProtocolStack
import spock.lang.AutoCleanup
import spock.lang.Shared
import spock.util.concurrent.PollingConditions

class TransportFailureConditionsSpec extends BaseEmbeddedBrokerSpec {

    @Shared
    def discovery = new InMemDiscovery()

    @AutoCleanup("shutdown")
    @Shared
    Muon muon1

    @AutoCleanup("shutdown")
    @Shared
    Muon muon2

    def setupSpec() {
        def simples
        muon1 = muon("clientservice")
        muon2 = muon("targetservice")
    }

    def "when broker dies, receive ChannelFailed"() {
        def sendToClient

        ChannelConnection connection = Mock(ChannelConnection) {
            receive(_) >> {
                sendToClient = new ChannelFunctionExecShimBecauseGroovyCantCallLambda(it[0])
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

        channel.receive {
            msg = it
        }

        when: "Send a message to open the channel"
        channel.send(outbound("targetservice", "rpc"))
        sleep(100)

        and:

        sleep(100)
        brokerStop()

        sleep(100)
        then:

        new PollingConditions(timeout: 3).eventually {
            msg != null
            msg.channelOperation == MuonMessage.ChannelOperation.closed
        }

        cleanup:
        StandardAsyncChannel.echoOut = false
    }

    def "when broker stops and starts, will reconnect and be contactable"() {
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

        when: "stop the broker and restart"
        brokerStop()
        sleep(65000)
        brokerStart()

        sleep(100)

        and: "Establish a channel"
        def channel = muon1.transportClient.openClientChannel()

        channel.receive {
            msg = it
        }
        channel.send(outbound("targetservice", "rpc"))

        then:

        new PollingConditions(timeout: 3).eventually {
            msg != null
        }

        cleanup:
        StandardAsyncChannel.echoOut = false
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

    private def muon(serviceName) {

        def connection = new RabbitMq09ClientAmqpConnection("amqp://muon:microservices@localhost:6743")
        def queueFactory = new RabbitMq09QueueListenerFactory(connection.channel)
        def serviceQueue = new DefaultServiceQueue(serviceName, connection)
        def channelFactory = new DefaultAmqpChannelFactory(serviceName, queueFactory, connection)

        def svc1 = new AMQPMuonTransport(
                "amqp://muon:microservices@localhost:6743", serviceQueue, channelFactory)

        def config = new AutoConfiguration(serviceName: serviceName)
        def muon = new MultiTransportMuon(config, discovery, [svc1], new JsonOnlyCodecs())

        return muon
    }
}
