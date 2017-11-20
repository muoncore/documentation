package io.muoncore.extension.amqp;

import io.muoncore.Discovery;
import io.muoncore.channel.Dispatchers;
import io.muoncore.channel.support.Scheduler;
import io.muoncore.codec.Codecs;

public class DefaultAmqpChannelFactory implements AmqpChannelFactory {

    private String localServiceName;
    private QueueListenerFactory listenerFactory;
    private AmqpConnection connection;
    private Codecs codecs;
    private Discovery discovery;
    private Scheduler scheduler;

    public DefaultAmqpChannelFactory(String localServiceName, QueueListenerFactory listenerFactory, AmqpConnection connection) {
        this.localServiceName = localServiceName;
        this.listenerFactory = listenerFactory;
        this.connection = connection;
    }

    @Override
    public AmqpChannel createChannel() {
        return new DefaultAmqpChannel(connection, listenerFactory, localServiceName, Dispatchers.dispatcher(), codecs, discovery, scheduler);
    }

    @Override
    public void shutdown() {
        connection.close();
    }

    @Override
    public void initialiseEnvironment(Codecs codecs, Discovery discovery, Scheduler scheduler) {
        this.codecs = codecs;
        this.discovery = discovery;
        this.scheduler = scheduler;
    }


}
