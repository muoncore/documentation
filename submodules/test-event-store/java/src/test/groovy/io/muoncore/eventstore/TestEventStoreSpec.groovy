package io.muoncore.eventstore

import io.muoncore.MultiTransportMuon
import io.muoncore.Muon
import io.muoncore.codec.json.JsonOnlyCodecs
import io.muoncore.config.AutoConfiguration
import io.muoncore.memory.discovery.InMemDiscovery
import io.muoncore.memory.transport.InMemTransport
import io.muoncore.memory.transport.bus.EventBus
import io.muoncore.protocol.event.ClientEvent
import io.muoncore.protocol.event.Event
import io.muoncore.protocol.event.client.DefaultEventClient
import io.muoncore.protocol.event.client.EventReplayMode
import org.reactivestreams.Subscriber
import org.reactivestreams.Subscription
import spock.lang.Specification
import spock.util.concurrent.PollingConditions

import java.lang.Void as Test

class TestEventStoreSpec extends Specification {

    def eventbus = new EventBus()
    def discovery = new InMemDiscovery()

  Test "hot subscription works"() {

    def muon = muon("chronos")
    def store = eventStore(muon)
    def client = new DefaultEventClient(muon)
    def data = []
    def done = false

    def id = 0

    when: "events emitted to multiple items in the tree"

    client.replay("/aggregate/team", EventReplayMode.REPLAY_THEN_LIVE, new Subscriber<Event>() {
      @Override
      void onSubscribe(Subscription s) {
        s.request(Integer.MAX_VALUE)
      }

      @Override
      void onNext(Event event) {
        println "GOT DATA $event"
        data << event
      }

      @Override
      void onError(Throwable t) {
        t.printStackTrace()
      }

      @Override
      void onComplete() {
        done = true
      }
    })

    sleep(100)

    10.times { println client.event(ClientEvent.ofType("Simple").stream("/aggregate/team").build()).getStatus() }
    10.times { println client.event(ClientEvent.ofType("Simple").stream("/aggregate/team2").build()).getStatus() }

    then:
    new PollingConditions().eventually {
      data.size() == 10
    }
  }

    Test "store can replay tree after event emits to multiple items"() {
        def muon = muon("chronos")
        def store = eventStore(muon)
        def client = new DefaultEventClient(muon)
        def data = []
        def done = false

        def id = 0

        when: "events emitted to multiple items in the tree"

        10.times { println client.event(ClientEvent.ofType("Simple").stream("/aggregate/team/12${id++}").build()).getStatus() }

        and: "replay"

        client.replay("/aggregate/team/**", EventReplayMode.REPLAY_ONLY, new Subscriber<Event>() {
            @Override
            void onSubscribe(Subscription s) {
                s.request(Integer.MAX_VALUE)
            }

            @Override
            void onNext(Event event) {
                data << event
            }

            @Override
            void onError(Throwable t) {
                t.printStackTrace()
            }

            @Override
            void onComplete() {
                done = true
            }
        })

        then:
        new PollingConditions().eventually {
            done &&
                    data.size() == 10 &&
              (data.eventTime as HashSet).size() == 10
        }
    }

    Muon muon(name) {
        def config = new AutoConfiguration(serviceName: name)
        config.setTags(["eventstore"])
        def transport = new InMemTransport(config, eventbus)

        new MultiTransportMuon(config, discovery, [transport], new JsonOnlyCodecs())
    }

    def eventStore(Muon muon) {
        return new TestEventStore(muon)
    }
}
