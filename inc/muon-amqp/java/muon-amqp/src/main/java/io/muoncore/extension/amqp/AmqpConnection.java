package io.muoncore.extension.amqp;

import com.rabbitmq.client.Channel;

import java.io.IOException;
import java.util.function.Consumer;

public interface AmqpConnection {
    ExecuteWithChannel getChannel();

    void send(QueueListener.QueueMessage message) throws IOException;
    void broadcast(QueueListener.QueueMessage message) throws IOException;

    boolean isAvailable();

    void close();
    void deleteQueue(String queue);

    interface ExecuteWithChannel {
        void executeOnEveryConnect(Consumer<Channel> exec);
        void executeNowIfChannelIsOpen(Consumer<Channel> exec);
    }
}
