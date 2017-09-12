package io.muoncore.extension.amqp.rabbitmq09;

import com.rabbitmq.client.*;
import io.muoncore.exception.MuonException;
import io.muoncore.extension.amqp.AmqpConnection;
import io.muoncore.extension.amqp.QueueListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URISyntaxException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.function.*;
import java.util.function.Consumer;

public class RabbitMq09ClientAmqpConnection implements AmqpConnection {

    private Logger log = LoggerFactory.getLogger(RabbitMq09ClientAmqpConnection.class.getName());

    private Connection connection;
    private Channel channel;

    private List<Consumer<Channel>> execList = new ArrayList<>();

    private boolean closed = false;


    public RabbitMq09ClientAmqpConnection(String rabbitUrl)
            throws IOException,
            NoSuchAlgorithmException,
            KeyManagementException,
            URISyntaxException {
        final ConnectionFactory factory = new ConnectionFactory();

        connectToAmqp(rabbitUrl, factory);

        try {
            synchronized (factory) {
                factory.wait(60000);
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        if (channel == null) {
            throw new MuonException("Unable to connect to remote rabbit within 60s, failing");
        }
    }

    @Override
    public void deleteQueue(String queue) {
        try {
            channel.queueDelete(queue);
        } catch (AlreadyClosedException e) {
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private synchronized void addToExecList(Consumer<Channel> exec) {
        execList.add(exec);
        if (channel != null && channel.isOpen()) {
            exec.accept(channel);
        }
    }

    @Override
    public ExecuteWithChannel getChannel() {
        return  new ExecuteWithChannel() {
            @Override
            public void executeOnEveryConnect(Consumer<Channel> exec) {
                addToExecList(exec);
            }

            @Override
            public void executeNowIfChannelIsOpen(Consumer<Channel> exec) {
                if (channel != null && channel.isOpen()) {
                    exec.accept(channel);
                }
            }
        };
    }

    private void runExecList() {
        execList.forEach(channelConsumer -> {
            try {
                channelConsumer.accept(channel);
            } catch (Exception e) {
                log.warn("Error running AMQP startup function", e);
            }
        });
    }

    private void connectToAmqp(String rabbitUrl, ConnectionFactory factory) {
        if (closed) return;
        new Thread(() -> {
            boolean reconnect = true;
            while (reconnect) {
                try {
//                    synchronized (RabbitMq09ClientAmqpConnection.this) {
                        log.info("Connecting to AMQP broker using url: " + rabbitUrl);
                        factory.setUri(rabbitUrl);
                        connection = factory.newConnection();
                        channel = connection.createChannel();

                        channel.addReturnListener((replyCode, replyText, exchange, routingKey, properties, body) -> {
                            log.trace("Message has returned on queue: " + routingKey);
                        });
//                    }
                    connection.addShutdownListener(cause -> {
                        if (closed) {
                            log.info("AMQP Client connection has closed down by request");
                        } else {
                            log.error("AMQP Client connection has shut down unexpectedly, starting reconnect cycle");
                        }
                        try {
                            connection.close();
                        } catch (Exception e) {
                            log.debug("Error closing connection", e);
                        }
                        channel = null;
                        connection = null;
                        try {
                            connectToAmqp(rabbitUrl, factory);
                        } catch (Exception e) {
                            log.error("Error starting connection...?", e);
                        }
                    });
                    reconnect = false;
                    runExecList();
                    synchronized (factory) {
                        factory.notify();
                    }
                } catch (IOException | TimeoutException e) {
                    log.warn("Unable to connect to AMQP Broker " + rabbitUrl + " retrying in 5s");
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException e1) {
                        e1.printStackTrace();
                    }
                } catch (URISyntaxException | NoSuchAlgorithmException | KeyManagementException e) {
                    log.error("Fatal error when connecting to the AMQP Broker, this cannot be fixed, terminating", e);
                    reconnect = false;
                    synchronized (factory) {
                        factory.notify();
                    }
                }
            }
        }).start();
    }

    @Override
    @SuppressWarnings("unchecked")
    public void send(QueueListener.QueueMessage message) throws IOException {
        if (!connectionIsReady()) return;
        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
//                .contentType(message.getContentType())

                .headers((Map) message.getHeaders()).build();

        channel.basicPublish("", message.getQueueName(), true, props, message.getBody());
    }

    @Override
    public void broadcast(QueueListener.QueueMessage message) throws IOException {
        if (!connectionIsReady()) return;

        byte[] messageBytes = message.getBody();

        Map<String, Object> headers = new HashMap<>(message.getHeaders());
        headers.put("Content-Type", message.getContentType());

        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                .contentType(message.getContentType())
                .headers(headers).build();

        channel.basicPublish("muon-broadcast", message.getQueueName(), props, messageBytes);
    }

    private boolean connectionIsReady() {
        return channel != null && channel.isOpen();
    }

    @Override
    public boolean isAvailable() {
        return connectionIsReady();
    }

    @Override
    public void close() {
        closed = true;
        try {
            if (channel != null && channel.isOpen()) {
                channel.close();
            }
            if (connection != null && connection.isOpen()) {
                connection.close();
            }
        } catch (ShutdownSignalException ex) {
            if (ex.isHardError()) {
                log.warn(ex.getMessage(), ex);
            }
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        }
    }
}
