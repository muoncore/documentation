package io.muoncore.extension.amqp

import io.muoncore.Discovery
import io.muoncore.channel.Reactor2Dispatcher
import io.muoncore.channel.support.Scheduler
import io.muoncore.codec.json.JsonOnlyCodecs
import io.muoncore.transport.client.RingBufferLocalDispatcher
import spock.lang.Specification

import static io.muoncore.extension.amqp.QueueListener.QueueFunction
import static io.muoncore.extension.amqp.QueueListener.QueueMessage

class DefaultAmqpChannelSpec extends Specification {

    def discovery = Mock(Discovery) {
        getCodecsForService(_) >> ["application/json"]
    }
    def codecs = new JsonOnlyCodecs()

//    def "when channel_op=closed received from left, cleanup the queues"() {
//        given:
//        QueueListener listener = Mock(QueueListener)
//        def listenerfactory = Mock(QueueListenerFactory) {
//            listenOnQueue(_, _ as QueueFunction) >> listener
//        }
//        def connection = Mock(AmqpConnection)
//        def channel = new DefaultAmqpChannel(connection, listenerfactory, "myawesomeservice", Environment.sharedDispatcher(), codecs, discovery, new Scheduler())
//
//        channel.respondToHandshake(new AmqpHandshakeMessage("fakeproto", "my-reply-queue", "receive-queue"))
//
//        when:
//        channel.send(MuonMessageBuilder.fromService("tombola").operation(MuonMessage.ChannelOperation.closed).build())
//
//        sleep(50)
//
//        then:
//        1 * listener.cancel()
//    }

    def "respondToHandshake opens a new queue and sends a handshake response"() {
        given:
        def listenerfactory = Mock(QueueListenerFactory)
        def connection = Mock(AmqpConnection)
        def channel = new DefaultAmqpChannel(connection, listenerfactory, "myawesomeservice", new Reactor2Dispatcher(new RingBufferLocalDispatcher("test")), codecs, discovery, new Scheduler())
        def localQueue

        when:
        channel.respondToHandshake(new AmqpHandshakeMessage("fakeproto", "my-reply-queue", "receive-queue"))

        then:
        1 * listenerfactory.listenOnQueue(_, _ as QueueFunction, _) >> { args -> localQueue = args[0]; return null }
        1 * connection.send({ QueueMessage message ->
            message.queueName == "my-reply-queue" &&
                    message.headers[QueueMessageBuilder.HEADER_PROTOCOL] == "fakeproto"

        } as QueueMessage)
    }

    def "initiateFromHandshake opens a new queue and sends a handshake response"() {
        given:

        def listenerfactory = Mock(QueueListenerFactory)
        def connection = Mock(AmqpConnection)
        def channel = new DefaultAmqpChannel(connection, listenerfactory, "awesomeservice", new Reactor2Dispatcher(new RingBufferLocalDispatcher("test")), codecs, discovery, new Scheduler())

        when:
        Thread.start {
            channel.initiateHandshake("remoteservice", "fakeproto")
        }
        sleep(100)
        then:
        1 * listenerfactory.listenOnQueue(_, _ as QueueFunction, _)
        1 * connection.send({ QueueMessage message ->
            message.queueName == "service.remoteservice" &&
                    message.headers[QueueMessageBuilder.HEADER_PROTOCOL] == "fakeproto" &&
                    message.headers[QueueMessageBuilder.HEADER_REPLY_TO] != null &&
                    message.headers[QueueMessageBuilder.HEADER_RECEIVE_QUEUE] != null
        } as QueueMessage)
    }
}
