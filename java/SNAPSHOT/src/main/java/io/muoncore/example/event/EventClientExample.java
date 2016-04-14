package io.muoncore.example.event;

import io.muoncore.Muon;
import io.muoncore.MuonBuilder;
import io.muoncore.config.AutoConfiguration;
import io.muoncore.config.MuonConfigBuilder;
import io.muoncore.protocol.event.ClientEvent;
import io.muoncore.protocol.event.Event;
import io.muoncore.protocol.event.client.DefaultEventClient;
import io.muoncore.protocol.event.client.EventClient;
import io.muoncore.protocol.event.client.EventReplayMode;
import reactor.rx.broadcast.Broadcaster;

import java.util.HashSet;
import java.util.Set;

public class EventClientExample {

    public static void main(String[] args) {

        AutoConfiguration config = MuonConfigBuilder.withServiceIdentifier("client").build();

        Muon muon = MuonBuilder.withConfig(config).build();

        muon.getDiscovery().blockUntilReady();

        // tag::createclient[]
        EventClient evclient = new DefaultEventClient(muon);
        // end::createclient[]

        // tag::replay[]
        Broadcaster<Event> sub = Broadcaster.create();
        sub.consume( msg -> {
//            println "EVENT = ${it}"

        });

        evclient.replay("users", EventReplayMode.REPLAY_THEN_LIVE, sub);
        // end::replay[]


        // tag::emitevent[]
        evclient.event(
                new ClientEvent<>(
                        "UserRegistered",
                        "users",
                        null,
                        null,
                        null,
                        new MyDataPayload()));

        // end::emitevent[]

        // tag::eventsource[]

        Set<String> userList = new HashSet<>();

        Broadcaster<Event> eventsourceSubscriber = Broadcaster.create();
        sub.consume( event -> {


        });

        evclient.replay("users", EventReplayMode.REPLAY_THEN_LIVE, sub);

        // end::eventsource[]


    }

    static class MyDataPayload {

    }
}
