package io.muoncore.extension.amqp;

import io.muoncore.channel.ChannelConnection;
import io.muoncore.extension.amqp.rabbitmq09.RabbitMq09QueueListener;
import lombok.extern.slf4j.Slf4j;

import static io.muoncore.extension.amqp.QueueMessageBuilder.HEADER_PROTOCOL;
import static io.muoncore.extension.amqp.QueueMessageBuilder.HEADER_RECEIVE_QUEUE;
import static io.muoncore.extension.amqp.QueueMessageBuilder.HEADER_REPLY_TO;

@Slf4j
public class DefaultServiceQueue implements ServiceQueue {

    private RabbitMq09QueueListener listener;
    private String serviceName;
    private AmqpConnection connection;

    public DefaultServiceQueue(String serviceName, AmqpConnection connection) {
        this.serviceName = serviceName;
        this.connection = connection;
    }

    @Override
    public void shutdown() {
        if (listener != null) listener.cancel();
        try { connection.close(); } catch (Exception ignored){}
    }

    @Override
    public void onHandshake(ChannelConnection.ChannelFunction<AmqpHandshakeMessage> channelFunction) {
        if (listener != null) throw new IllegalStateException("QueueListener already has a handshake.");

        listener = new RabbitMq09QueueListener(connection.getChannel(), "service." + serviceName, fun -> {

            log.trace("Handshake received on service queue {}, will dispatch to {}", fun, fun);

            if (fun == null) return;

            AmqpHandshakeMessage handshake = new AmqpHandshakeMessage(
                    fun.getHeaders().get(HEADER_PROTOCOL).toString(),
                    fun.getHeaders().get(HEADER_REPLY_TO).toString(),
                    fun.getHeaders().get(HEADER_RECEIVE_QUEUE).toString());

            channelFunction.apply(handshake);
        }, () -> {
            log.trace("Service queue is being cleanly shut down");
        });

        listener.start();
        listener.blockUntilReady();
    }
}
