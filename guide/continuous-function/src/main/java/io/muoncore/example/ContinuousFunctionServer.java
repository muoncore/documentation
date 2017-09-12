package io.muoncore.example;

import io.muoncore.Muon;
import io.muoncore.MuonBuilder;
import io.muoncore.config.AutoConfiguration;
import io.muoncore.config.MuonConfigBuilder;
import io.muoncore.protocol.reactivestream.server.PublisherLookup;
import reactor.rx.Streams;
import reactor.rx.broadcast.Broadcaster;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static io.muoncore.protocol.requestresponse.server.HandlerPredicates.all;


/**
 * Simple Muon server example with RPC and streaming endpoints.
 */
public class ContinuousFunctionServer {


    public static void main(String[] args) throws Exception {

        muonServer();

        Thread.sleep(2000);

        System.out.println("Use Ctrl-C to exit");
    }

    private static Muon muonServer() throws Exception {
        AutoConfiguration config = MuonConfigBuilder
                .withServiceIdentifier("example-service")
                .build();

        Muon muon = MuonBuilder.withConfig(config).build();
        muon.getDiscovery().blockUntilReady();

        muon.handleRequest(all(), request -> {
            System.out.println("A request has been made ");
            request.ok(Collections.singletonMap("Hello", "World" + System.currentTimeMillis()));
        });

        muon.publishSource("hello", PublisherLookup.PublisherType.COLD,
                Streams.from(Arrays.asList(1,2,3,4)));

        return muon;
    }
}
