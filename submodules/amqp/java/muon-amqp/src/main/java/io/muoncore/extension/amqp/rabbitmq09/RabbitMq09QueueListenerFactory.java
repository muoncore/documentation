package io.muoncore.extension.amqp.rabbitmq09;

import com.rabbitmq.client.Channel;
import io.muoncore.extension.amqp.AmqpConnection;
import io.muoncore.extension.amqp.QueueListener;
import io.muoncore.extension.amqp.QueueListenerFactory;

public class RabbitMq09QueueListenerFactory implements QueueListenerFactory {

    private AmqpConnection.ExecuteWithChannel channel;

    public RabbitMq09QueueListenerFactory(AmqpConnection.ExecuteWithChannel channel) {
        this.channel = channel;
    }

    @Override
    public QueueListener listenOnQueue(String queueName, QueueListener.QueueFunction function, Runnable onShutdown) {
        RabbitMq09QueueListener listener = new RabbitMq09QueueListener(channel, queueName, function, onShutdown);
        listener.start();
        listener.blockUntilReady();
        return listener;
    }

    @Override
    public QueueListener listenOnBroadcast(String topicName, QueueListener.QueueFunction function) {
        RabbitMq09BroadcastListener listener = new RabbitMq09BroadcastListener(channel, topicName, function);
        listener.start();
        listener.blockUntilReady();
        return listener;
    }
}
