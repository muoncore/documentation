package io.muoncore.eventstore

import io.muoncore.Muon
import io.muoncore.liblib.reactor.rx.Streams
import io.muoncore.liblib.reactor.rx.broadcast.Broadcaster
import io.muoncore.protocol.event.Event
import io.muoncore.protocol.event.server.EventServerProtocolStack
import io.muoncore.protocol.event.server.EventWrapper
import io.muoncore.protocol.reactivestream.messages.ReactiveStreamSubscriptionRequest
import io.muoncore.protocol.reactivestream.server.PublisherLookup
import io.muoncore.protocol.reactivestream.server.ReactiveStreamServer
import org.reactivestreams.Publisher
import org.reactivestreams.Subscriber
import org.reactivestreams.Subscription
import org.slf4j.Logger
import org.slf4j.LoggerFactory

import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.atomic.AtomicLong

/*
 A test event store, implementing the core interfaces of Photon.
 */

class TestEventStore {

  public static Logger log = LoggerFactory.getLogger(TestEventStore)

  final List<Event> history = new ArrayList<>();
  List<Broadcaster> subs = new ArrayList<>();
  AtomicLong orderid = new AtomicLong(1)

  void clear() {
    synchronized (history) {
      history.clear()
    }
  }

  TestEventStore(Muon muon) {

    def rs = new ReactiveStreamServer(muon)

    rs.publishGeneratedSource("/stream", PublisherLookup.PublisherType.HOT_COLD) { ReactiveStreamSubscriptionRequest request ->

      def stream = request.args["stream-name"]
      def streamType = request.args["stream-type"]
      if (!streamType) streamType = "hot-cold"

      log.info "Subscribing to $stream"

      def b = Broadcaster.<Event> create()

      BlockingQueue q = new LinkedBlockingQueue()

      subs << b

      b.map {
        if (it instanceof EventWrapper) {
          return it.event
        }
        it
      }.filter { it.streamName == stream }.consume {
        q.add(it)
      }

      if (streamType == "cold") {
        synchronized (history) {
          def items = history.findAll {
            matches(it.streamName, stream)
          }


          log.info "Requested a cold replay, found ${items.size()} items in the stream"

          if (items) {
            return Streams.from(items)
          } else {
            return Streams.empty()
          }
        }
      }

      if (request.args["stream-type"] && streamType == "hot-cold") {
        synchronized (history) {
          log.debug "Has requested hot-cold replay .. "
          history.findAll {
            matches(it.streamName, stream)
          }.each { q.add(it) }
        }
      }

      new Publisher() {
        @Override
        void subscribe(Subscriber s) {
          AtomicLong itemstoprocess = new AtomicLong(0)

          boolean running = true
          Thread t = Thread.start {
            while (running) {
              if (itemstoprocess.get() > 0) {
                def next = q.take()
                s.onNext(next)
                itemstoprocess.decrementAndGet()
              }
              if (itemstoprocess.get() <= 0) {
                sleep(100)
              }
            }
          }

          s.onSubscribe(new Subscription() {
            @Override
            void request(long n) {
              itemstoprocess.addAndGet(n)
            }

            @Override
            void cancel() {
              running = false
            }
          })
        }
      }

    }

    muon.protocolStacks.registerServerProtocol(new EventServerProtocolStack({ event ->
      log.debug "Event received " + event.event
      try {
        synchronized (history) {
          def orderId = orderid.addAndGet(1)
          Event ev = event.event
          ev.orderId = orderId
          ev.eventTime = System.currentTimeMillis()
          log.info("persisted $ev")
          history.add(ev);
          event.persisted(ev.orderId, ev.eventTime);
          subs.stream().forEach({ q ->
            q.accept(event)
          });
        }
      } catch (Exception ex) {
        event.failed(ex.getMessage());
      }
    }, muon.getCodecs(), muon.getDiscovery()));
  }

  def matches(name, pattern) {
    pattern = pattern.replaceAll("\\*\\*", ".\\*")
    name ==~ pattern
  }
}

